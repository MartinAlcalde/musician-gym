import { labelForMidi, toCanonicalDegreeMidi } from '../utils/helpers.js'

export function KeyMapping({ 
  exerciseSet, 
  tonicMidi,
  scaleType,
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
        {exerciseSet.map(midi => {
          const mappingMidi = toCanonicalDegreeMidi(midi, tonicMidi, scaleType)
          return (
            <KeyMappingRow
              key={midi}
              midi={midi}
              tonicMidi={tonicMidi}
              scaleType={scaleType}
              notation={notation}
              mappedKey={getKeyForMidi(mappingMidi)}
              onStartMapping={() => startMapping(mappingMidi)}
              onClearMapping={() => clearKeymap(mappingMidi)}
              isWaiting={waitingMapMidi === mappingMidi}
            />
          )
        })}
      </div>
    </>
  )
}

function KeyMappingRow({ midi, tonicMidi, scaleType, notation, mappedKey, onStartMapping, onClearMapping, isWaiting }) {
  return (
    <>
      <div className="map-row map-note">
        {labelForMidi(midi, notation, tonicMidi % 12, scaleType)}
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
