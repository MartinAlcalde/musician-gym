import { useCallback, useEffect, useRef, useState } from 'react'

const AXIS_THRESHOLD = 0.5

function bytesToHex(dataView) {
  return Array.from(new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

function safeIdPart(value) {
  return encodeURIComponent(String(value || 'unknown'))
}

function gamepadDeviceId(gamepad) {
  return `gamepad:${safeIdPart(gamepad.id)}`
}

function hidDeviceId(device) {
  return `hid:${device.vendorId.toString(16)}:${device.productId.toString(16)}:${safeIdPart(device.productName)}`
}

export function RemoteControl({ onKeyTest }) {
  const [hidStatus, setHidStatus] = useState('Not connected')
  const [bluetoothStatus, setBluetoothStatus] = useState('Not connected')
  const [gamepadStatus, setGamepadStatus] = useState('Not detected')
  const [keyTestLine, setKeyTestLine] = useState('Press a key or your remote…')
  const [keyTestDetail, setKeyTestDetail] = useState('')

  const animationFrameRef = useRef(null)
  const lastButtonStatesRef = useRef(new Map())
  const lastAxisDirectionsRef = useRef(new Map())
  const hidConnectionsRef = useRef(new Map())
  const bluetoothConnectionRef = useRef(null)
  const onKeyTestRef = useRef(onKeyTest)
  const mountedRef = useRef(false)

  const isSecureContext = window.isSecureContext
  const hasWebHID = Boolean(navigator.hid)
  const hasWebBluetooth = Boolean(navigator.bluetooth)
  const hasGamepadApi = typeof navigator.getGamepads === 'function'

  useEffect(() => {
    onKeyTestRef.current = onKeyTest
  }, [onKeyTest])

  const stopGamepadPolling = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    lastButtonStatesRef.current.clear()
    lastAxisDirectionsRef.current.clear()
  }, [])

  const startGamepadPolling = useCallback(() => {
    if (!hasGamepadApi || animationFrameRef.current !== null) return

    const poll = () => {
      const gamepads = navigator.getGamepads()

      for (const gamepad of gamepads) {
        if (!gamepad) continue

        gamepad.buttons.forEach((button, buttonIndex) => {
          const stateKey = `${gamepad.index}:button:${buttonIndex}`
          const wasPressed = lastButtonStatesRef.current.get(stateKey) === true

          if (button.pressed && !wasPressed) {
            const deviceId = gamepadDeviceId(gamepad)
            const inputId = `${deviceId}:button:${buttonIndex}`
            setKeyTestLine(`Gamepad ${gamepad.index} button ${buttonIndex} pressed`)
            setKeyTestDetail(inputId)
            onKeyTestRef.current?.({
              type: 'gamepad',
              deviceId,
              inputId,
              gamepadId: gamepad.id,
              gamepadIndex: gamepad.index,
              buttonIndex,
              value: button.value
            })
          }

          lastButtonStatesRef.current.set(stateKey, button.pressed)
        })

        gamepad.axes.forEach((axisValue, axisIndex) => {
          const stateKey = `${gamepad.index}:axis:${axisIndex}`
          const direction = Math.abs(axisValue) > AXIS_THRESHOLD
            ? (axisValue > 0 ? 'pos' : 'neg')
            : null
          const previousDirection = lastAxisDirectionsRef.current.get(stateKey) || null

          if (direction && direction !== previousDirection) {
            const deviceId = gamepadDeviceId(gamepad)
            const inputId = `${deviceId}:axis:${axisIndex}:${direction}`
            setKeyTestLine(`Gamepad ${gamepad.index} axis ${axisIndex} ${direction}`)
            setKeyTestDetail(inputId)
            onKeyTestRef.current?.({
              type: 'gamepad',
              deviceId,
              inputId,
              gamepadId: gamepad.id,
              gamepadIndex: gamepad.index,
              axisIndex,
              axisDirection: direction,
              value: axisValue
            })
          }

          lastAxisDirectionsRef.current.set(stateKey, direction)
        })
      }

      animationFrameRef.current = requestAnimationFrame(poll)
    }

    animationFrameRef.current = requestAnimationFrame(poll)
  }, [hasGamepadApi])

  const closeHidConnections = useCallback(() => {
    hidConnectionsRef.current.forEach((inputHandler, device) => {
      device.removeEventListener('inputreport', inputHandler)
      if (device.opened) device.close().catch(() => {})
    })
    hidConnectionsRef.current.clear()
  }, [])

  const closeBluetoothConnection = useCallback(() => {
    const connection = bluetoothConnectionRef.current
    bluetoothConnectionRef.current = null
    if (!connection) return

    connection.characteristic?.removeEventListener('characteristicvaluechanged', connection.valueHandler)
    connection.device.removeEventListener('gattserverdisconnected', connection.disconnectHandler)
    if (connection.characteristic) connection.characteristic.stopNotifications().catch(() => {})
    if (connection.device.gatt?.connected) connection.device.gatt.disconnect()
  }, [])

  const connectHID = async () => {
    if (!hasWebHID || !isSecureContext) return

    try {
      const devices = await navigator.hid.requestDevice({
        filters: [
          { usagePage: 0x0C },
          { usagePage: 0x01, usage: 0x06 },
          { usagePage: 0x01, usage: 0x02 },
          { usagePage: 0x01, usage: 0x80 }
        ]
      })

      if (!devices.length) {
        setHidStatus('No device selected')
        return
      }

      let connectedCount = 0
      for (const device of devices) {
        if (!mountedRef.current) return

        if (!device.opened) await device.open()
        if (!mountedRef.current) {
          if (device.opened) device.close().catch(() => {})
          return
        }
        if (hidConnectionsRef.current.has(device)) {
          connectedCount += 1
          continue
        }

        const inputHandler = (event) => {
          const data = bytesToHex(event.data)
          const deviceId = hidDeviceId(device)
          const inputId = `${deviceId}:report:${event.reportId}:${data}`

          setKeyTestLine(`HID report ${event.reportId}: ${data}`)
          setKeyTestDetail(inputId)
          onKeyTestRef.current?.({
            type: 'hid',
            deviceId,
            inputId,
            productName: device.productName,
            vendorId: device.vendorId,
            productId: device.productId,
            reportId: event.reportId,
            data
          })
        }

        device.addEventListener('inputreport', inputHandler)
        hidConnectionsRef.current.set(device, inputHandler)
        connectedCount += 1
      }

      setHidStatus(`Connected: ${connectedCount} device(s)`)
    } catch (error) {
      if (mountedRef.current) setHidStatus(`Failed: ${error.message}`)
    }
  }

  const connectBluetooth = async () => {
    if (!hasWebBluetooth) {
      setBluetoothStatus('Bluetooth not supported')
      return
    }

    try {
      closeBluetoothConnection()
      setBluetoothStatus('Requesting device...')

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '00001812-0000-1000-8000-00805f9b34fb',
          '0000180f-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb'
        ]
      })
      const deviceName = device.name || 'Unnamed device'

      if (!mountedRef.current) return
      setBluetoothStatus(`Connecting to ${deviceName}...`)

      const disconnectHandler = () => {
        if (bluetoothConnectionRef.current?.device !== device) return
        bluetoothConnectionRef.current = null
        if (mountedRef.current) setBluetoothStatus('Disconnected')
      }
      device.addEventListener('gattserverdisconnected', disconnectHandler)
      bluetoothConnectionRef.current = {
        device,
        characteristic: null,
        valueHandler: null,
        disconnectHandler
      }

      const server = await device.gatt.connect()
      if (!mountedRef.current) {
        closeBluetoothConnection()
        return
      }

      const services = await server.getPrimaryServices()
      let characteristic = null
      for (const service of services) {
        const characteristics = await service.getCharacteristics()
        characteristic = characteristics.find(candidate => candidate.properties.notify || candidate.properties.indicate)
        if (characteristic) break
      }

      if (!characteristic) {
        setBluetoothStatus(`Connected to ${deviceName}, but no input was found`)
        return
      }

      const valueHandler = (event) => {
        const data = bytesToHex(event.target.value)
        const deviceId = `bluetooth:${safeIdPart(device.id)}`
        const inputId = `${deviceId}:characteristic:${safeIdPart(characteristic.uuid)}:${data}`

        setKeyTestLine(`Bluetooth data: ${data}`)
        setKeyTestDetail(inputId)
        onKeyTestRef.current?.({
          type: 'bluetooth',
          deviceId,
          inputId,
          bluetoothDeviceId: device.id,
          deviceName,
          serviceId: characteristic.service.uuid,
          characteristicId: characteristic.uuid,
          data
        })
      }

      await characteristic.startNotifications()
      if (!mountedRef.current) {
        closeBluetoothConnection()
        return
      }
      characteristic.addEventListener('characteristicvaluechanged', valueHandler)
      bluetoothConnectionRef.current = { device, characteristic, valueHandler, disconnectHandler }
      setBluetoothStatus(`Connected: ${deviceName}`)
    } catch (error) {
      closeBluetoothConnection()
      if (mountedRef.current) setBluetoothStatus(`Failed: ${error.message}`)
    }
  }

  const detectGamepad = () => {
    if (!hasGamepadApi) {
      setGamepadStatus('Gamepad API not supported')
      return
    }

    startGamepadPolling()
    const gamepad = Array.from(navigator.getGamepads()).find(Boolean)

    if (gamepad) {
      setGamepadStatus(`Connected: ${gamepad.id} (${gamepad.buttons.length} buttons, ${gamepad.axes.length} axes)`)
    } else {
      setGamepadStatus('Listening — press a gamepad button')
    }
  }

  useEffect(() => {
    mountedRef.current = true

    const handleGamepadConnected = (event) => {
      setGamepadStatus(`Connected: ${event.gamepad.id}`)
      startGamepadPolling()
    }

    const handleGamepadDisconnected = (event) => {
      const statePrefix = `${event.gamepad.index}:`
      for (const key of lastButtonStatesRef.current.keys()) {
        if (key.startsWith(statePrefix)) lastButtonStatesRef.current.delete(key)
      }
      for (const key of lastAxisDirectionsRef.current.keys()) {
        if (key.startsWith(statePrefix)) lastAxisDirectionsRef.current.delete(key)
      }
      setGamepadStatus('Disconnected')
    }

    const handleHidDisconnected = (event) => {
      const inputHandler = hidConnectionsRef.current.get(event.device)
      if (!inputHandler) return
      event.device.removeEventListener('inputreport', inputHandler)
      hidConnectionsRef.current.delete(event.device)
      setHidStatus('Disconnected')
    }

    window.addEventListener('gamepadconnected', handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)
    navigator.hid?.addEventListener?.('disconnect', handleHidDisconnected)

    return () => {
      mountedRef.current = false
      window.removeEventListener('gamepadconnected', handleGamepadConnected)
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
      navigator.hid?.removeEventListener?.('disconnect', handleHidDisconnected)
      stopGamepadPolling()
      closeHidConnections()
      closeBluetoothConnection()
    }
  }, [closeBluetoothConnection, closeHidConnections, startGamepadPolling, stopGamepadPolling])

  const hidNote = !hasWebHID || !isSecureContext
    ? 'WebHID requires a secure context (https or localhost).'
    : 'Connect your shutter, then press a button to test or map it.'

  return (
    <>
      <h3 className="remote-heading">External controls</h3>
      <div className="panel remote-control-panel">
        <div className="row remote-control-row">
          <button type="button" onClick={connectHID} disabled={!hasWebHID || !isSecureContext}>
            Connect HID
          </button>
          <span className="muted" role="status" aria-live="polite">{hidStatus}</span>
        </div>

        <div className="row remote-control-row">
          <button type="button" onClick={connectBluetooth} disabled={!hasWebBluetooth}>
            🔵 Connect Bluetooth
          </button>
          <span className="muted" role="status" aria-live="polite">{bluetoothStatus}</span>
        </div>

        <div className="row remote-control-row">
          <button type="button" onClick={detectGamepad} disabled={!hasGamepadApi}>
            🎮 Detect Gamepad
          </button>
          <span className="muted" role="status" aria-live="polite">{gamepadStatus}</span>
        </div>

        <p className="muted remote-note">{hidNote}</p>
      </div>

      <h3 className="remote-heading">Input tester</h3>
      <div className="panel remote-control-panel" role="status" aria-live="polite" aria-atomic="true">
        <div>{keyTestLine}</div>
        {keyTestDetail && <div className="muted remote-input-id">Input ID: {keyTestDetail}</div>}
      </div>
    </>
  )
}
