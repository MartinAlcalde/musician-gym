import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'

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
  const { t } = useI18n()
  const [hidStatus, setHidStatus] = useState({ key: 'remote.notConnected' })
  const [bluetoothStatus, setBluetoothStatus] = useState({ key: 'remote.notConnected' })
  const [gamepadStatus, setGamepadStatus] = useState({ key: 'remote.notDetected' })
  const [keyTestLine, setKeyTestLine] = useState({ key: 'remote.testPrompt' })
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
            setKeyTestLine({
              key: 'remote.gamepadButton',
              variables: { gamepad: gamepad.index, button: buttonIndex }
            })
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
            setKeyTestLine({
              key: 'remote.gamepadAxis',
              variables: { gamepad: gamepad.index, axis: axisIndex, direction }
            })
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
        setHidStatus({ key: 'remote.noDevice' })
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

          setKeyTestLine({ key: 'remote.hidReport', variables: { report: event.reportId, data } })
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

      setHidStatus({ key: 'remote.connectedCount', variables: { count: connectedCount } })
    } catch (error) {
      if (mountedRef.current) setHidStatus({ key: 'remote.failed', variables: { error: error.message } })
    }
  }

  const connectBluetooth = async () => {
    if (!hasWebBluetooth) {
      setBluetoothStatus({ key: 'remote.bluetoothUnsupported' })
      return
    }

    try {
      closeBluetoothConnection()
      setBluetoothStatus({ key: 'remote.requesting' })

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '00001812-0000-1000-8000-00805f9b34fb',
          '0000180f-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb'
        ]
      })
      const deviceName = device.name || t('remote.unnamed')

      if (!mountedRef.current) return
      setBluetoothStatus({ key: 'remote.connecting', variables: { device: deviceName } })

      const disconnectHandler = () => {
        if (bluetoothConnectionRef.current?.device !== device) return
        bluetoothConnectionRef.current = null
        if (mountedRef.current) setBluetoothStatus({ key: 'remote.disconnected' })
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
        setBluetoothStatus({ key: 'remote.noInput', variables: { device: deviceName } })
        return
      }

      const valueHandler = (event) => {
        const data = bytesToHex(event.target.value)
        const deviceId = `bluetooth:${safeIdPart(device.id)}`
        const inputId = `${deviceId}:characteristic:${safeIdPart(characteristic.uuid)}:${data}`

        setKeyTestLine({ key: 'remote.bluetoothData', variables: { data } })
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
      setBluetoothStatus({ key: 'remote.connectedDevice', variables: { device: deviceName } })
    } catch (error) {
      closeBluetoothConnection()
      if (mountedRef.current) setBluetoothStatus({ key: 'remote.failed', variables: { error: error.message } })
    }
  }

  const detectGamepad = () => {
    if (!hasGamepadApi) {
      setGamepadStatus({ key: 'remote.gamepadUnsupported' })
      return
    }

    startGamepadPolling()
    const gamepad = Array.from(navigator.getGamepads()).find(Boolean)

    if (gamepad) {
      setGamepadStatus({
        key: 'remote.gamepadConnected',
        variables: { device: gamepad.id, buttons: gamepad.buttons.length, axes: gamepad.axes.length }
      })
    } else {
      setGamepadStatus({ key: 'remote.listening' })
    }
  }

  useEffect(() => {
    mountedRef.current = true

    const handleGamepadConnected = (event) => {
      setGamepadStatus({ key: 'remote.connectedDevice', variables: { device: event.gamepad.id } })
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
      setGamepadStatus({ key: 'remote.disconnected' })
    }

    const handleHidDisconnected = (event) => {
      const inputHandler = hidConnectionsRef.current.get(event.device)
      if (!inputHandler) return
      event.device.removeEventListener('inputreport', inputHandler)
      hidConnectionsRef.current.delete(event.device)
      setHidStatus({ key: 'remote.disconnected' })
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
    ? t('remote.hidSecure')
    : t('remote.hidHelp')

  const statusText = status => t(status.key, status.variables)

  return (
    <>
      <h3 className="remote-heading">{t('remote.title')}</h3>
      <div className="panel remote-control-panel">
        <div className="row remote-control-row">
          <button type="button" onClick={connectHID} disabled={!hasWebHID || !isSecureContext}>
            {t('remote.connectHid')}
          </button>
          <span className="muted" role="status" aria-live="polite">{statusText(hidStatus)}</span>
        </div>

        <div className="row remote-control-row">
          <button type="button" onClick={connectBluetooth} disabled={!hasWebBluetooth}>
            {t('remote.connectBluetooth')}
          </button>
          <span className="muted" role="status" aria-live="polite">{statusText(bluetoothStatus)}</span>
        </div>

        <div className="row remote-control-row">
          <button type="button" onClick={detectGamepad} disabled={!hasGamepadApi}>
            {t('remote.detectGamepad')}
          </button>
          <span className="muted" role="status" aria-live="polite">{statusText(gamepadStatus)}</span>
        </div>

        <p className="muted remote-note">{hidNote}</p>
      </div>

      <h3 className="remote-heading">{t('remote.tester')}</h3>
      <div className="panel remote-control-panel" role="status" aria-live="polite" aria-atomic="true">
        <div>{statusText(keyTestLine)}</div>
        {keyTestDetail && <div className="muted remote-input-id">{t('remote.inputId', { id: keyTestDetail })}</div>}
      </div>
    </>
  )
}
