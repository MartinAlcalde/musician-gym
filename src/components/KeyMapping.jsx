import { labelForMidi } from '../utils/helpers.js'

export function KeyMapping({ 
  exerciseSet, 
  notation, 
  getKeyForMidi, 
  startMapping, 
  clearKeymap,
  waitingMapMidi 
}) {
  return (
    <>
      <div style={{marginTop: '8px', fontWeight: 600}}>Key Mapping</div>
      <div className="map-grid" style={{marginTop: '6px'}}>
        {exerciseSet.map(midi => (
          <KeyMappingRow
            key={midi}
            midi={midi}
            notation={notation}
            mappedKey={getKeyForMidi(midi)}
            onStartMapping={() => startMapping(midi)}
            onClearMapping={() => clearKeymap(midi)}
            isWaiting={waitingMapMidi === midi}
          />
        ))}
      </div>
    </>
  )
}

function KeyMappingRow({ midi, notation, mappedKey, onStartMapping, onClearMapping, isWaiting }) {
  return (
    <>
      <div className="map-row map-note">
        {labelForMidi(midi, notation)}
      </div>
      <button className="btn" onClick={onStartMapping}>
        {isWaiting ? 'Press key...' : 'Set key'}
      </button>
      <div className="map-key">
        {mappedKey || '—'}
      </div>
      <button className="btn" onClick={onClearMapping}>
        Clear
      </button>
    </>
  )
}