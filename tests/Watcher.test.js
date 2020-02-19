const Watcher = require('../src/Watcher')
const path = require('path')
const fse = require('fs-extra')
const hashFiles = require('hash-files')

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

    watcher.watch(testWatchDirPath)

    const expectedFileList = [
      path.join(testWatchDirPath, 'file_a.txt'),
      path.join(testWatchDirPath, 'file_b.txt')
    ]

    const startTime = new Date().getTime()
    const writeDelay = 250

    setTimeout(() => {
      fse.writeFileSync(expectedFileList[0], 'a', { encoding: 'utf8' })
    }, writeDelay)

    setTimeout(() => {
      fse.writeFileSync(expectedFileList[1], 'b', { encoding: 'utf8' })
    }, writeDelay * 2)

    // Should only happen once
    watcher.on('change', (changedDir) => {
      const delayTime = new Date().getTime() - startTime
      // The debounce should ensure that the change event only happens after files stop changing
      expect(delayTime).toBeGreaterThan(watcher._changeTriggerDelay + writeDelay * 2)
      expect(changedDir).toEqual(testWatchDirPath)
      expect(watcher.fileList).toEqual(
        expect.arrayContaining(expectedFileList)
      )

      watcher.stop()
        .then(() => {
          watcher.removeAllListeners('change')
          done()
        })
    })
  }, 8000)
})
