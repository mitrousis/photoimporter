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

    watcher.watch(testWatchDirPath)

    const expectedFileList = [
      path.join(testWatchDirPath, 'file_a.txt'),
      path.join(testWatchDirPath, 'file_b.txt')
    ]

    const startTime = new Date().getTime()
    const writeDelay = 500

    setTimeout(() => {
      fse.writeFileSync(expectedFileList[0], 'a', { encoding: 'utf8' })
    }, writeDelay)

    setTimeout(() => {
      fse.writeFileSync(expectedFileList[1], 'b', { encoding: 'utf8' })
    }, writeDelay * 2)

    // Should only happen once
    watcher.on(Watcher.EVENT_FILE_LIST_UPDATED, (updatedFileList) => {
      const delayTime = new Date().getTime() - startTime
      // The debounce should ensure that the change event only happens after files stop changing
      expect(delayTime).toBeGreaterThan(watcher._changeTriggerDelay + writeDelay * 2)
      expect(updatedFileList).toEqual(
        expect.arrayContaining(expectedFileList)
      )

      watcher.stop()
        .then(() => {
          watcher.removeAllListeners(Watcher.EVENT_FILE_LIST_UPDATED)
          done()
        })
    })
  }, 8000)

  test('Watching empty folder should not hang process', (done) => {
    expect.assertions(1)

    const watcher = new Watcher()

    const emptyWatchDir = path.join(__dirname, './_fixtures/', 'test-watch-folder', './empty')
    fse.mkdirpSync(emptyWatchDir)

    watcher.on(Watcher.EVENT_FILE_LIST_UPDATED, (updatedFileList) => {
      expect(updatedFileList).toHaveLength(0)

      watcher.stop()
        .then(() => {
          watcher.removeAllListeners(Watcher.EVENT_FILE_LIST_UPDATED)
          done()
        })
    })

    watcher.watch(emptyWatchDir)
  })
})
