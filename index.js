const fs = require('fs');
const path = require('path');
const Observer = require('./observer');

// Копируем файлы из папки источника в итоговую папку предварительно создавая подкаталоги с именем равным первой букве файла
function sortableFiles(src_path, dist_path) {
  if (fs.existsSync(src_path)) {
    fs.readdir(src_path, (err, files) => {
      if(err) {
        console.log(err);
        return;
      }
      files.forEach(function(file) {
        let startLetterFileName = file.slice(0, 1).toUpperCase();
        let file_src_path = path.join(src_path, `${file}`);
        let file_dist_path = path.join(dist_path, `${startLetterFileName}`, `${file}`);
        let directory_dist_path = path.join(dist_path, `${startLetterFileName}`);
        if (fs.lstatSync(file_src_path).isDirectory()) {
          sortableFiles(file_src_path, dist_path);
        } else {
          if (!fs.existsSync(directory_dist_path)) {
            fs.mkdirSync(directory_dist_path);
          }
          fs.link(file_src_path, file_dist_path, (err) => {
            if(err) {
              console.log(err);
            }
          })
        }
      })
    })
  }
}

let directoryObserver = new Observer(() => {
  fs.mkdir(path.join(__dirname, 'dist'), (err) => {
    sortableFiles(path.join(__dirname, 'files'), path.join(__dirname, 'dist'));
  });
})
directoryObserver.start('Началось слежение за удаляемыми папками');

// Удаляем итоговую папку dist рекурсивно, если она существует
function rimraf(dir_path) {
  fs.access(dir_path, fs.constants.F_OK, (err) => {
    if(err){
      console.log('1', err);
      // Создаем итоговую папку dist
      fs.mkdir(path.join(__dirname, 'dist'), (err) => {
        sortableFiles(path.join(__dirname, 'files'), path.join(__dirname, 'dist'));
      });
      return;
    }
    fs.readdir(dir_path, (err, files) => {
      if(err) {
        console.log('2', err);
        return;
      }
      let fileObserver = new Observer(() => {
        directoryObserver.addObserver(dir_path);
        fs.rmdir(dir_path, (err) => {
          if(err) {
            console.log('5', err);
            return;
          }
          directoryObserver.removeObserver(dir_path);
        });
      })
      fileObserver.start(`Началось слежение за удаляемыми файлами в папке ${dir_path}`);
      files.forEach(function(file) {
        let file_path = path.join(dir_path, file);
        fs.lstat(file_path, (err, stats) => {
          if (err) {
            console.log('3', err);
            return;
          }
          if (stats.isDirectory()) {
            rimraf(file_path);
          } else {
            fileObserver.addObserver(file_path);
            fs.unlink(file_path, (err) => {
              if (err) {
                console.log('4', err);
                return;
              }
              fileObserver.removeObserver(file_path);
            });
          }
        })
      })
    })
  });
}
rimraf(path.join(__dirname, 'dist'));




