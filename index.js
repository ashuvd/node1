const fs = require('fs');
const path = require('path');
const Observer = require('./observer');

let argv = process.argv.slice(2);
let sortableCompleted = false;


if (argv.length) {
  let source_path = path.join(__dirname, argv[0]);
  let destination_path = argv[1] ? path.join(__dirname, argv[1]) : path.join(__dirname, 'dist')
  let copyObserver = new Observer(() => {
    sortableCompleted = true;
    if (argv[2]) {
      rimraf(source_path, source_path);
    }
  })
  let directoryObserver = new Observer(() => {
    fs.mkdir(destination_path, (err) => {
      if (err) {
        return;
      }
      if (!sortableCompleted) {
        copyObserver.start('Началось слежение за копируемыми файлами');
        sortableFiles(source_path, destination_path);
      }
    });
  })
  directoryObserver.start('Началось слежение за удаляемыми папками');

  // Удаляем итоговую папку dist рекурсивно, если она существует
  function rimraf(src_path, dist_path, func) {
    fs.access(dist_path, fs.constants.F_OK, (err) => {
      if(err){
        // Создаем итоговую папку dist
        fs.mkdir(dist_path, (err) => {
          copyObserver.start('Началось слежение за копируемыми файлами');
          sortableFiles(src_path, dist_path);
        });
        return;
      }
      fs.readdir(dist_path, (err, files) => {
        if(err) {
          console.log('2', err);
          return;
        }
        if (files.length == 0) {
          directoryObserver.addObserver(dist_path);
          fs.rmdir(dist_path, (err) => {
            if(err) {
              console.log('55', err);
              return;
            }
            directoryObserver.removeObserver(dist_path);
          });
        }
        let fileObserver = new Observer(() => {
          directoryObserver.addObserver(dist_path);
          fs.rmdir(dist_path, (err) => {
            if(err) {
              console.log('555', err);
              return;
            }
            directoryObserver.removeObserver(dist_path);
            if (dist_path != destination_path && dist_path != source_path) {
              func(dist_path);
            }
          });
        })
        fileObserver.start(`Началось слежение за удаляемыми файлами в папке ${dist_path}`);
        files.forEach(function(file) {
          let file_path = path.join(dist_path, file);
          fs.lstat(file_path, (err, stats) => {
            fileObserver.addObserver(file_path);
            if (err) {
              console.log('3', err);
              return;
            }
            if (stats.isDirectory()) {
              rimraf(src_path, file_path, fileObserver.removeObserver.bind(fileObserver));
            } else {
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
  // Копируем файлы из папки источника в итоговую папку предварительно создавая подкаталоги с именем равным первой букве файла
  function sortableFiles(src_path, dist_path) {
    fs.access(src_path, fs.constants.F_OK, (err) => {
      if(err){
        console.log('19', err);
        return;
      }
      fs.readdir(src_path, (err, files) => {
        if(err) {
          console.log('20', err);
          return;
        }
        files.forEach(function(file) {
          let startLetterFileName = file.slice(0, 1).toUpperCase();
          let file_src_path = path.join(src_path, `${file}`);
          let file_dist_path = path.join(dist_path, `${startLetterFileName}`, `${file}`);
          let directory_dist_path = path.join(dist_path, `${startLetterFileName}`);
          fs.lstat(file_src_path, (err, stats) => {
            if (err) {
              console.log('21', err);
              return;
            }
            if (stats.isDirectory()) {
              sortableFiles(file_src_path, dist_path);
            } else {
              fs.access(directory_dist_path, fs.constants.F_OK, (err) => {
                copyObserver.addObserver(file_src_path);
                if(err){
                  fs.mkdir(directory_dist_path, (err) => {
                    fs.link(file_src_path, file_dist_path, (err) => {
                      if(err) {
                        console.log('22', err);
                      }
                      copyObserver.removeObserver(file_src_path);
                    })
                  });
                } else {
                  fs.link(file_src_path, file_dist_path, (err) => {
                    if(err) {
                      console.log('23', err);
                    }
                    copyObserver.removeObserver(file_src_path);
                  })
                }
              })
            }
          })
        })
      })
    })
  }
  rimraf(source_path, destination_path);
} else {
  console.info('Необходимо задать путь к исходной папке в первом параметре! Пример: ./files')
  console.info('Также можете задать путь к итоговой папке во втором параметре. По умолчанию: ./dist')
  console.info('Также можете указать необходимость удаления исходной папки в третьем параметре!, по умолчанию = false')
}






