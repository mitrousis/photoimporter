const Watcher = require('../src/Watcher')
const path = require('path')
const fse = require('fs-extra')

describe('Watcher integration tests', () => {
  let testWatchDirPath
  let watcher

  beforeAll(() => {
    testWatchDirPath = path.join(__dirname, './_fixtures/', 'test-watch-folder')
    fse.mkdirpSync(testWatchDirPath)
  })

  afterEach((done) => {
    if (watcher) {
      watcher.removeAllListeners()
      watcher.stop()
        .then(() => {
          watcher = null
          done()
        })
    }
  })
  // Cleanup
  afterAll(() => {
    fse.removeSync(testWatchDirPath)
  })

  test('Should wait until files stop add events', (done) => {
    watcher = new Watcher()

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

      done()
    })
  }, 8000)

  test('Watching empty folder should not hang process', (done) => {
    expect.assertions(1)

    watcher = new Watcher()

    const emptyWatchDir = path.join(__dirname, './_fixtures/', 'test-watch-folder', './empty')
    fse.mkdirpSync(emptyWatchDir)

    watcher.on(Watcher.EVENT_FILE_LIST_UPDATED, (updatedFileList) => {
      expect(updatedFileList).toHaveLength(0)

      done()
    })

    watcher.watch(emptyWatchDir)
  })

  test('Adding files to a _duplicates folder shouldn\'t trigger watching', (done) => {
    expect.assertions(3)

    watcher = new Watcher()

    const watchDir = path.join(__dirname, './_fixtures/', 'test-watch-folder', './dupecheck')
    const subfolderWatchDir = path.join(__dirname, './_fixtures/', 'test-watch-folder', './dupecheck/subfolder')
    const duplicatesDir = path.join(__dirname, './_fixtures/', 'test-watch-folder', './dupecheck/_duplicates')

    const expectedFirstFile = path.join(watchDir, 'file1.txt')
    const expectedSecondFile = path.join(subfolderWatchDir, 'file2.txt')
    const notExpectedSecondFile = path.join(duplicatesDir, 'file3.txt')

    fse.mkdirpSync(watchDir)

    // First event
    watcher.once(Watcher.EVENT_FILE_LIST_UPDATED, (updatedFileList) => {
      expect(updatedFileList[0]).toEqual(expectedFirstFile)

      // Second event
      watcher.once(Watcher.EVENT_FILE_LIST_UPDATED, (updatedFileList) => {
        expect(updatedFileList[0]).not.toEqual(notExpectedSecondFile)
        expect(updatedFileList[0]).toEqual(expectedSecondFile)

        done()
      })

      // Write second file
      fse.mkdirpSync(duplicatesDir)
      fse.writeFileSync(notExpectedSecondFile, '0')

      // setTimeout(() => {
      //   // Write expected file
      fse.mkdirpSync(subfolderWatchDir)
      fse.writeFileSync(expectedSecondFile, '0')
      // }, 1000)
    })

    watcher.watch(watchDir, '**/_duplicates/**')

    // Write first file
    fse.writeFileSync(expectedFirstFile, '0')
  }, 10000)
})
