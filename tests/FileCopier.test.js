const FileCopier = require('../src/FileCopier')
const path = require('path')
const fse = require('fs-extra')

describe('FileCopier', () => {
  /** @type {FileCopier} */
  let fc
  const testFolder = path.join(__dirname, './_fixtures/', 'delete_me_filecopier/')
  const testFolderDest = path.join(__dirname, './_fixtures/', 'delete_me_filecopier/dest/')

  beforeAll(() => {
    fc = new FileCopier()
    fse.mkdirpSync(testFolder)
    fse.mkdirpSync(testFolderDest)
  })

  afterAll(() => {
    fse.removeSync(testFolder)
  })

  test('#_incrementFilename() formats as expected', () => {
    expect(fc._incrementFilename('a/b/c/test.jpeg'))
      .toEqual('a/b/c/test_00.jpeg')

    expect(fc._incrementFilename('a/b/c/test_00.jpeg'))
      .toEqual('a/b/c/test_01.jpeg')

    expect(fc._incrementFilename('a/b/c/test_.jpeg'))
      .toEqual('a/b/c/test__00.jpeg')

    expect(fc._incrementFilename('a/b/c/test_1234.jpeg'))
      .toEqual('a/b/c/test_1234_00.jpeg')

    expect(fc._incrementFilename('a/b/c/test.png'))
      .toEqual('a/b/c/test_00.png')
  })

  test('addToQueue() creates a queue item ', () => {
    fc._fileQueue = []

    const queueItem = fc.addToQueue('/source/file.txt', '/dest/file.txt', true, false)

    expect(fc._fileQueue).toHaveLength(1)
    expect(queueItem).toMatchObject({
      source: '/source/file.txt',
      destination: '/dest/file.txt',
      moveFile: true,
      preserveDuplicate: false
    })
  })

  test('addToQueue() appends target file to destination', () => {
    fc._fileQueue = []

    const queueItem = fc.addToQueue('/source/file.txt', '/dest/', true, true)

    expect(fc._fileQueue).toHaveLength(1)
    expect(queueItem).toMatchObject({
      source: '/source/file.txt',
      destination: '/dest/file.txt',
      moveFile: true,
      preserveDuplicate: true
    })
  })

  describe.only('#_processNextFile()', () => {
    test('#_processNextFile() should copy a file successfully', async () => {
      const source = path.join(testFolder, 'sourceFile1.txt')
      const destination = path.join(testFolderDest, 'destFile1.txt')

      fse.writeFileSync(source, 'some data')

      const success = await fc._processNextFile([
        {
          source,
          destination,
          moveFile: false,
          preserveDuplicate: true
        }
      ])

      expect(success).toEqual(true)
      expect(fse.existsSync(destination)).toEqual(true)
    })

    test('#_processNextFile() should move a file successfully', async () => {
      const source = path.join(testFolder, 'sourceFile2.txt')
      const destination = path.join(testFolderDest, 'destFile2.txt')

      fse.writeFileSync(source, 'some data')

      const success = await fc._processNextFile([
        {
          source,
          destination,
          moveFile: true,
          preserveDuplicate: true
        }
      ])

      expect(success).toEqual(true)
      expect(fse.existsSync(destination)).toEqual(true)
      expect(fse.existsSync(source)).toEqual(false)
    })

    test('#_processNextFile() should return false and rename destination when duplicate filename is found', async () => {
      const source = path.join(testFolder, 'sourceFile3.txt')
      const destination = path.join(testFolderDest, 'destFile3.txt')
      const fileParams = {
        source,
        destination,
        moveFile: true,
        preserveDuplicate: true
      }

      fse.writeFileSync(source, 'some data')
      fse.writeFileSync(destination, 'some data 2')

      const success = await fc._processNextFile([fileParams])

      expect(success).toEqual(false)
      expect(fileParams.destination).toEqual(path.join(testFolderDest, 'destFile3_00.txt'))
      // Shouldn't have moved
      expect(fse.existsSync(source)).toEqual(true)
    })

    test('#_processNextFile() should return false and rename destination to duplicate folder when exact duplicate file is found', async () => {
      const source = path.join(testFolder, 'sourceFile4.txt')
      const destination = path.join(testFolderDest, 'sourceFile4.txt')

      fc.duplicatesDir = path.join(testFolder, '/duplicates/')
      const expectedDupeDestination = path.join(fc.duplicatesDir, 'sourceFile4.txt')

      const fileParams = {
        source,
        destination,
        moveFile: true,
        preserveDuplicate: true
      }

      fse.writeFileSync(source, 'matching data')
      fse.writeFileSync(destination, 'matching data')

      const fileQueue = [fileParams]
      const success = await fc._processNextFile(fileQueue)

      expect(success).toEqual(false)
      expect(fileParams.destination).toEqual(expectedDupeDestination)
      // Shouldn't have moved
      expect(fse.existsSync(source)).toEqual(true)
      expect(fileQueue).toHaveLength(1)
      expect(fileQueue[0]).toMatchObject({
        source,
        destination: expectedDupeDestination,
        moveFile: true,
        preserveDuplicate: false
      })
    })
  })

  // // Cleanup
  // afterAll(() => {
  //   fse.removeSync(testWatchDirPath)
  // })

  // test('Should wait until files stop add events', (done) => {
  //   const watcher = new Watcher()

  //   watcher.watch(testWatchDirPath)

  //   const expectedFileList = [
  //     path.join(testWatchDirPath, 'file_a.txt'),
  //     path.join(testWatchDirPath, 'file_b.txt')
  //   ]

  //   const startTime = new Date().getTime()
  //   const writeDelay = 250

  //   setTimeout(() => {
  //     fse.writeFileSync(expectedFileList[0], 'a', { encoding: 'utf8' })
  //   }, writeDelay)

  //   setTimeout(() => {
  //     fse.writeFileSync(expectedFileList[1], 'b', { encoding: 'utf8' })
  //   }, writeDelay * 2)

  //   // Should only happen once
  //   watcher.on('change', (changedDir) => {
  //     const delayTime = new Date().getTime() - startTime
  //     // The debounce should ensure that the change event only happens after files stop changing
  //     expect(delayTime).toBeGreaterThan(watcher._changeTriggerDelay + writeDelay * 2)
  //     expect(changedDir).toEqual(testWatchDirPath)
  //     expect(watcher.fileList).toEqual(
  //       expect.arrayContaining(expectedFileList)
  //     )

  //     watcher.stop()
  //       .then(() => {
  //         watcher.removeAllListeners('change')
  //         done()
  //       })
  //   })
  // }, 8000)
})
