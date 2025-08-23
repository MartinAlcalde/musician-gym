import { useState, useEffect } from 'react'

export function RemoteControl({ onKeyTest }) {
  const [hidStatus, setHidStatus] = useState('Not connected')
  const [bluetoothStatus, setBluetoothStatus] = useState('Not connected')
  const [gamepadStatus, setGamepadStatus] = useState('Not detected')
  const [keyTestLine, setKeyTestLine] = useState('Press a key or your remote…')
  const [keyTestDetail, setKeyTestDetail] = useState('')
  const [gamepadPolling, setGamepadPolling] = useState(null)
  const [lastButtonStates, setLastButtonStates] = useState({})

  const isSecureContext = window.isSecureContext
  const hasWebHID = !!navigator.hid
  const hasWebBluetooth = !!navigator.bluetooth

  const startGamepadPolling = () => {
    console.log('🎮 [GAMEPAD] Starting polling...')
    if (gamepadPolling) return
    
    const poll = () => {
      const gamepads = navigator.getGamepads()
      
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i]
        if (!gamepad) continue
        
        // Check each button
        for (let j = 0; j < gamepad.buttons.length; j++) {
          const button = gamepad.buttons[j]
          const wasPressed = lastButtonStates[`${i}-${j}`] || false
          const isPressed = button.pressed
          
          if (isPressed && !wasPressed) {
            console.log(`🎮 [GAMEPAD] Button ${j} pressed on gamepad ${i}`, {
              value: button.value,
              touched: button.touched
            })
            setKeyTestLine(`Gamepad ${i} button ${j} pressed (value: ${button.value.toFixed(2)})`)
            onKeyTest?.({ type: 'gamepad', gamepadIndex: i, buttonIndex: j, value: button.value })
          }
          
          setLastButtonStates(prev => ({
            ...prev,
            [`${i}-${j}`]: isPressed
          }))
        }
      }
    }
    
    const intervalId = setInterval(poll, 100) // Poll every 100ms
    setGamepadPolling(intervalId)
  }
  
  const stopGamepadPolling = () => {
    console.log('🎮 [GAMEPAD] Stopping polling...')
    if (gamepadPolling) {
      clearInterval(gamepadPolling)
      setGamepadPolling(null)
    }
    setLastButtonStates({})
  }

  const connectHID = async () => {
    if (!hasWebHID || !isSecureContext) return
    
    try {
      const filters = [
        { usagePage: 0x0C },
        { usagePage: 0x01, usage: 0x06 },
        { usagePage: 0x01, usage: 0x02 },
        { usagePage: 0x01, usage: 0x80 },
      ]
      
      const devices = await navigator.hid.requestDevice({ filters })
      
      if (!devices || devices.length === 0) {
        setHidStatus('No device selected')
        return
      }
      
      for (const device of devices) {
        await device.open().catch(() => {})
        device.addEventListener('inputreport', (event) => {
          const hexBytes = Array.from(new Uint8Array(event.data.buffer))
            .map(b => b.toString(16).padStart(2, '0')).join('')
          
          setKeyTestLine(`HID reportId ${event.reportId} (${hexBytes})`)
          onKeyTest?.({ type: 'hid', data: hexBytes, reportId: event.reportId })
        })
      }
      
      setHidStatus(`Connected: ${devices.length} device(s)`)
    } catch (error) {
      setHidStatus(`Failed: ${error.message}`)
    }
  }

  const connectBluetooth = async () => {
    if (!hasWebBluetooth) {
      setBluetoothStatus('Bluetooth not supported')
      return
    }

    try {
      setBluetoothStatus('Requesting device...')
      
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '00001812-0000-1000-8000-00805f9b34fb',
          '0000180f-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb',
        ]
      })

      setBluetoothStatus(`Connecting to ${device.name}...`)
      
      const server = await device.gatt.connect()
      const services = await server.getPrimaryServices()
      
      let characteristic = null
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics()
          for (const char of characteristics) {
            if (char.properties.notify || char.properties.indicate) {
              characteristic = char
              break
            }
          }
          if (characteristic) break
        } catch (error) {
          console.log('Service error:', error)
        }
      }
      
      if (characteristic) {
        await characteristic.startNotifications()
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
          const data = new Uint8Array(event.target.value.buffer)
          const hexBytes = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('')
          
          setKeyTestLine(`Bluetooth data: ${hexBytes} (${data.length} bytes)`)
          onKeyTest?.({ type: 'bluetooth', data: hexBytes })
        })
      }
      
      setBluetoothStatus(`Connected: ${device.name}`)
    } catch (error) {
      setBluetoothStatus(`Failed: ${error.message}`)
    }
  }

  const detectGamepad = () => {
    console.log('🎮 [GAMEPAD] detectGamepad called')
    const gamepads = navigator.getGamepads()
    console.log('🎮 [GAMEPAD] Found gamepads:', gamepads.length)
    
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i]
      if (gamepad) {
        console.log(`🎮 [GAMEPAD] Gamepad ${i}:`, {
          id: gamepad.id,
          buttons: gamepad.buttons.length,
          axes: gamepad.axes.length,
          connected: gamepad.connected
        })
        setGamepadStatus(`Connected: ${gamepad.id} (${gamepad.buttons.length} buttons, ${gamepad.axes.length} axes)`)
        return true
      }
    }
    
    console.log('🎮 [GAMEPAD] No gamepads found')
    setGamepadStatus('No gamepad detected - press a button first')
    return false
  }

  useEffect(() => {
    const handleGamepadConnected = (e) => {
      console.log('🎮 [GAMEPAD] Connected:', e.gamepad)
      setGamepadStatus(`Connected: ${e.gamepad.id}`)
      startGamepadPolling()
    }
    
    const handleGamepadDisconnected = (e) => {
      console.log('🎮 [GAMEPAD] Disconnected:', e.gamepad)
      setGamepadStatus('Disconnected')
      stopGamepadPolling()
    }

    window.addEventListener('gamepadconnected', handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)
    
    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected)
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
      stopGamepadPolling()
    }
  }, [])

  const hidNote = !hasWebHID || !isSecureContext 
    ? 'WebHID requires a secure context (https or localhost). Open this page via http://localhost to connect a remote.'
    : 'Click Connect Remote to pair your shutter. Then press a button to test or map it.'

  return (
    <>
      <div style={{marginTop: '10px', fontWeight: 600}}>BLE Remote</div>
      <div className="panel" style={{marginTop: '6px', padding: '8px'}}>
        <div className="row" style={{margin: 0, gap: '10px', alignItems: 'center'}}>
          <button onClick={connectHID} disabled={!hasWebHID || !isSecureContext}>
            Connect HID
          </button>
          <div className="muted">{hidStatus}</div>
        </div>
        
        <div className="row" style={{margin: '6px 0 0 0', gap: '10px', alignItems: 'center'}}>
          <button onClick={connectBluetooth} disabled={!hasWebBluetooth}>
            🔵 Connect Bluetooth
          </button>
          <div className="muted">{bluetoothStatus}</div>
        </div>
        
        <div className="row" style={{margin: '6px 0 0 0', gap: '10px', alignItems: 'center'}}>
          <button onClick={detectGamepad}>
            🎮 Detect Gamepad
          </button>
          <div className="muted">{gamepadStatus}</div>
        </div>
        
        <div className="muted" style={{marginTop: '6px', fontSize: '12px'}}>
          {hidNote}
        </div>
      </div>

      <div style={{marginTop: '10px', fontWeight: 600}}>Key Tester</div>
      <div className="panel" style={{marginTop: '6px', padding: '8px'}}>
        <div>{keyTestLine}</div>
        <div className="muted" style={{marginTop: '4px', fontSize: '12px'}}>
          {keyTestDetail}
        </div>
      </div>
    </>
  )
}