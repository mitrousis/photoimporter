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

  test('#addToQueue() creates a queue item ', () => {
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

  test('#addToQueue() appends target file to destination', () => {
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

  describe('#_processQueueItem()', () => {
    test('#_processQueueItem() should copy a file successfully', async () => {
      const source = path.join(testFolder, 'sourceFile1.txt')
      const destination = path.join(testFolderDest, 'destFile1.txt')

      fse.writeFileSync(source, 'some data')

      const success = await fc._processQueueItem({
        source,
        destination,
        moveFile: false,
        preserveDuplicate: true
      })

      expect(success).toEqual(true)
      expect(fse.existsSync(destination)).toEqual(true)
    })

    test('#_processQueueItem() should move a file successfully', async () => {
      const source = path.join(testFolder, 'sourceFile2.txt')
      const destination = path.join(testFolderDest, 'destFile2.txt')

      fse.writeFileSync(source, 'some data')

      const success = await fc._processQueueItem({
        source,
        destination,
        moveFile: true,
        preserveDuplicate: true
      })

      expect(success).toEqual(true)
      expect(fse.existsSync(destination)).toEqual(true)
      expect(fse.existsSync(source)).toEqual(false)
    })

    test('#_processQueueItem() should return false and rename destination when duplicate filename is found', async () => {
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

      const success = await fc._processQueueItem(fileParams)

      expect(success).toEqual(false)
      expect(fileParams.destination).toEqual(path.join(testFolderDest, 'destFile3_00.txt'))
      // Shouldn't have moved
      expect(fse.existsSync(source)).toEqual(true)
    })

    test('#_processQueueItem() should return false and rename destination to duplicate folder when exact duplicate file is found', async () => {
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

      const success = await fc._processQueueItem(fileParams)

      expect(success).toEqual(false)
      expect(fileParams.destination).toEqual(expectedDupeDestination)
      // Shouldn't have moved
      expect(fse.existsSync(source)).toEqual(true)
      // Params object should have been modified
      expect(fileParams).toMatchObject({
        source,
        destination: expectedDupeDestination,
        moveFile: true,
        preserveDuplicate: false
      })
    })
  })

  describe('Queue processing', () => {
    test('Queue should run and emit event when complete', (done) => {
      const destFileList = []

      fc.on(FileCopier.EVENT_QUEUE_COMPLETE, () => {
        expect(fc._fileQueue).toHaveLength(0)

        destFileList.forEach((filePath) => {
          expect(fse.existsSync(filePath)).toEqual(true)
        })

        done()
      })

      for (let i = 0; i < 5; i++) {
        const source = path.join(testFolder, `queue_source_${i}.txt`)
        const destination = path.join(testFolderDest, `queue_dest_${i}.txt`)
        fse.writeFileSync(source, 'some data')

        destFileList.push(destination)

        fc.addToQueue(source, destination, true, false)
      }
    }, 3000)

    test('Adding items to a queue over time should make it continue processing', (done) => {
      const destFileList = []
      const addTimeoutOffset = 750
      let numFiles = 0
      const startTime = new Date()

      fc.on(FileCopier.EVENT_QUEUE_COMPLETE, () => {
        expect(fc._fileQueue).toHaveLength(0)

        destFileList.forEach((filePath) => {
          expect(fse.existsSync(filePath)).toEqual(true)
        })

        const endTime = new Date()
        expect(endTime - startTime).toBeGreaterThan(addTimeoutOffset * (numFiles - 1) + 1000)

        done()
      })

      for (numFiles = 0; numFiles < 5; numFiles++) {
        const source = path.join(testFolder, `queue_source_${numFiles}.txt`)
        const destination = path.join(testFolderDest, `queue_dest_${numFiles}.txt`)
        fse.writeFileSync(source, 'some data')

        destFileList.push(destination)

        setTimeout(() => {
          fc.addToQueue(source, destination, true, false)
        }, addTimeoutOffset * numFiles)
      }
    }, 8000)
  })
})
