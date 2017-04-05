const fs = require('fs')
const path = require('path')
const unzip = require('unzip')
const mkdirp = require('mkdirp')
const shell = require('electron').shell

// prevent default behaviour (dragging images and dropping them will show them)
document.ondragover = () => false
document.ondragleave = () => false
document.ondragend = () => false

document.ondrop = (e) => {
  e.preventDefault()

  const files = e.dataTransfer.files

  if (files.length !== 1 || files[0].type !== 'application/x-zip-compressed') {
    return
  }

  const dirname = path.dirname(files[0].path)
  let outputDirname

  fs.createReadStream(files[0].path)
    .pipe(unzip.Parse())
    .on('entry', (entry) => {
      const outputFilename = newFilename(dirname, entry.path)
      if (!outputFilename || entry.type === 'Directory') {
        return entry.autodrain()
      }
      // create directory
      if (!outputDirname) {
        outputDirname = path.dirname(outputFilename)
        mkdirp.sync(outputDirname)
      }
      // write
      entry.pipe(fs.createWriteStream(outputFilename))
    }).on('close', () => {
      shell.showItemInFolder(outputDirname)
    })
}

/**
 * newFileName('/path/to/dir', 'Rapport elektrolyse_1240521/Etternavn_Fornavn Mellomnavn (brukernavn)/filnavn.txt')
 * => '/path/to/dir/Rapport elektrolyse_1240521/Fornavn Mellomnavn Etternavn filnavn.txt'
 * @param {*string} dirname
 * @param {*string} filename
 */
function newFilename(dirname, filename) {
  const r = /^([^\/]+)\/([^_]+)_([^\(]+) \([^\)]+\)\/(.+)$/
  const match = filename.match(r)
  if (!match) {
    return
  }
  const [_, dir, lastname, firstname, file] = match
  return path.join(dirname, dir, [firstname, lastname, file].join(' '))
}