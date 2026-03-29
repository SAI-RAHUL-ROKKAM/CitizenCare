const http = require('http')
const fs = require('fs')

const testCases = [
  { expected: 'Hospital',    text: 'The doctor at the city hospital refused to treat my father. The nurse was rude and the ambulance took 2 hours.' },
  { expected: 'Police',      text: 'My phone was stolen near the bus stand last night. I want to file an FIR for the theft.' },
  { expected: 'Sanitation',  text: 'Garbage piled up near main road for 3 weeks. Dustbin overflowing and sewage drain clogged and stinking.' },
  { expected: 'Roads',       text: 'Huge pothole on MG Road near the school. Two bikes fell into it. Road surface completely broken.' },
  { expected: 'Water',       text: 'No water supply in our area for 5 days. Pipeline leaking near borewell and tap gives dirty water.' },
  { expected: 'Electricity', text: 'Power cut in colony for 3 days. Transformer broken and streetlight not working for weeks.' },
  { expected: 'Education',   text: 'School building roof leaking. Teachers absent regularly and midday meal not served to students.' },
  { expected: 'Rescue',      text: 'Building collapsed near market. People trapped inside. Send fire brigade and rescue team immediately.' },
  { expected: 'Transport',   text: 'Bus on route 45 always late and overcrowded. Conductor refuses tickets. Bus stop has no shelter.' },
  { expected: 'Municipal',   text: 'Illegal construction next to my property. Stray dogs everywhere and parking area encroached.' },
  { expected: 'Environment', text: 'Factory releasing smoke and chemical pollution into the river. Trees being cut illegally.' },
  // NEW TEST CASE FOR HEALTH EMERGENCY
  { expected: 'Hospital',    text: 'My grandma got sick and fainted. Please send an ambulance immediately near City Hospital.' },
]

function makeRequest(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body)
    const req = http.request({
      hostname: 'localhost', port: 3000, path: '/api/process',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let chunks = ''
      res.on('data', c => chunks += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(chunks) }) }
        catch (e) { reject(new Error('Invalid JSON')) }
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(data)
    req.end()
  })
}

async function runTests() {
  const lines = []
  const log = (msg) => { lines.push(msg) }
  let passed = 0, failed = 0

  log('======================================================================')
  log('  DEPARTMENT CATEGORIZATION TEST - 11 Departments')
  log('======================================================================')
  log('')

  for (const tc of testCases) {
    try {
      const { status, data } = await makeRequest({ text: tc.text, language: 'English' })

      if (status !== 200) {
        const dept = data.detail ? data.detail : 'unknown'
        log('[DB-ERR] Expected: ' + tc.expected + ' | Error: ' + (data.detail || data.error))
        // DB errors don't necessarily mean bad categorization - the keyword matching still works
        failed++
        continue
      }

      const match = data.department === tc.expected
      const icon = match ? 'PASS' : 'FAIL'
      log('[' + icon + '] Expected: ' + tc.expected + ' | Got: ' + data.department + ' | Urgency: ' + data.urgency)
      if (match) passed++; else failed++
    } catch (err) {
      log('[ERR]  Expected: ' + tc.expected + ' | Error: ' + err.message)
      failed++
    }
  }

  log('')
  log('======================================================================')
  log('  RESULTS: ' + passed + ' passed, ' + failed + ' failed out of ' + testCases.length)
  log('======================================================================')

  const output = lines.join('\n')
  fs.writeFileSync('test-results.txt', output, 'utf-8')
  console.log('Results written to test-results.txt')
}

runTests()
