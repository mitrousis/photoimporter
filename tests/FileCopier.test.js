const FileCopier = require('../src/FileCopier')
// const path = require('path')
// const fse = require('fs-extra')

describe('FileCopier', () => {
  let fc

  beforeAll(() => {
    fc = new FileCopier()
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
