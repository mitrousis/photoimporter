const Watcher = require('../src/Watcher')
const path = require('path')
const fse = require('fs-extra')

describe('Watcher', () => {
  let testWatchDirPath

  beforeAll(() => {
    testWatchDirPath = path.join(__dirname, './_fixtures/', 'test-watch-folder')
    fse.mkdirpSync(testWatchDirPath)
  })

  // Cleanup
  afterAll(() => {
    fse.removeSync(testWatchDirPath)
  })

  test('Should wait until files stop add events', (done) => {
    const watcher = new Watcher()
    watcher._changeTriggerDelay = 2000
    watcher._changePollingInterval = 100
    watcher.watch(testWatchDirPath)

    const startTime = new Date().getTime()
    const writeDelay = 250

    setTimeout(() => {
      fse.writeFileSync(path.join(testWatchDirPath, 'file_a.txt'), 'a', { encoding: 'utf8' })
    }, writeDelay)

    setTimeout(() => {
      fse.writeFileSync(path.join(testWatchDirPath, 'file_b.txt'), 'b', { encoding: 'utf8' })
    }, writeDelay * 2)

    // Should only happen once
    watcher.on('change', (changedDir) => {
      const delayTime = new Date().getTime() - startTime
      // The debounce should ensure that the change event only happens after files stop changing
      expect(delayTime).toBeGreaterThan(watcher._changeTriggerDelay + writeDelay * 2)
      expect(changedDir).toEqual(testWatchDirPath)
      expect(fse.readdirSync(testWatchDirPath)).toEqual(expect.arrayContaining([
        'file_a.txt',
        'file_b.txt'
      ]))

      watcher.stop()
      watcher.removeAllListeners('change')
      done()
    })
  }, 8000)
})
