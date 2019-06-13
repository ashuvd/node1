const fs = require('fs');
const path = require('path');

let argv = process.argv.slice(2);

if (argv.length) {
  let source_path = path.join(__dirname, argv[0]);
  let destination_path = argv[1] ? path.join(__dirname, argv[1]) : path.join(__dirname, 'dist')


  function copyFile(file, src_path, dist_path) {
    return new Promise(function(resolve, reject) {
      let startLetterFileName = file.slice(0, 1).toUpperCase();
      let file_src_path = path.join(src_path, `${file}`);
      let file_dist_path = path.join(dist_path, `${startLetterFileName}`, `${file}`);
      let directory_dist_path = path.join(dist_path, `${startLetterFileName}`);
      fs.lstat(file_src_path, (err, stats) => {
        if (err) {
          return reject(err);
        }
        if (stats.isDirectory()) {
          resolve(sortableFiles(file_src_path, dist_path));
        } else {
          fs.access(directory_dist_path, fs.constants.F_OK, (err) => {
            if(err){
              fs.mkdir(directory_dist_path, (err) => {
                fs.link(file_src_path, file_dist_path, (err) => {
                  if(err) {
                    return reject(err);
                  }
                  resolve();
                })
              });
            } else {
              fs.link(file_src_path, file_dist_path, (err) => {
                if(err) {
                  return reject(err);
                }
                resolve();
              })
            }
          })
        }
      })
    })
  }

  function deleteFile(src_path, file_path) {
    return new Promise(function(resolve, reject) {
      fs.lstat(file_path, (err, stats) => {
        if (err) {
          return reject(err);
        }
        if (stats.isDirectory()) {
          resolve(rimraf(src_path, file_path));
        } else {
          fs.unlink(file_path, (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        }
      })
    })
  }
  // Удаляем итоговую папку dist рекурсивно, если она существует
  function rimraf(src_path, dist_path) {
    return new Promise(function (resolve, reject) {
      fs.access(dist_path, fs.constants.F_OK, (err) => {
        if(err){
          // Создаем итоговую папку dist
          fs.mkdir(dist_path, (err) => {
            sortableFiles(src_path, dist_path).then(function() {
              console.log('Все файлы скопированы, приложение завершает свою работу')
            }).catch(function(error) {
              console.log(error)
            });;
          });
          return;
        }
        fs.readdir(dist_path, (err, files) => {
          if(err) {
            return reject(err);
          }
          Promise.all(files.map(function (file) {
            let file_path = path.join(dist_path, file);
            return deleteFile(src_path, file_path);
          })).then(function () {
              fs.rmdir(dist_path, function (err) {
                  if (err) {
                      return reject(err);
                  }
                  resolve();
              });
          }).catch(reject);
        })
      });
    })
  }
  // Копируем файлы из папки источника в итоговую папку предварительно создавая подкаталоги с именем равным первой букве файла
  function sortableFiles(src_path, dist_path) {
    return new Promise(function(resolve, reject) {
      fs.access(src_path, fs.constants.F_OK, (err) => {
        if(err){
          return reject(err);
        }
        fs.readdir(src_path, (err, files) => {
          if(err) {
            return reject(err);
          }
          Promise.all(files.map(function (file) {
            return copyFile(file, src_path, dist_path);
          })).then(function () {
              resolve();
          }).catch(reject);
        })
      })
    })
  }
  rimraf(source_path, destination_path).then(function() {
    fs.mkdir(destination_path, (err) => {
      sortableFiles(source_path, destination_path).then(function() {
        console.log('Все файлы скопированы, приложение завершает свою работу')
      }).catch(function(error) {
        console.log(error)
      });
    });
  }).catch(function(error) {
    console.log(error)
  });
} else {
  console.info('Необходимо задать путь к исходной папке в первом параметре! Пример: ./files')
  console.info('Также можете задать путь к итоговой папке во втором параметре. По умолчанию: ./dist')
  console.info('Также можете указать необходимость удаления исходной папки в третьем параметре!, по умолчанию = false')
}






