<template>
  <div id="app">
    <el-dialog title="转换进度" center :close-on-click-modal="false" :close-on-press-escape="false" :visible="converting"
      :show-close="false">
      <div>正在转换第 {{ converted }} 个文件，共 {{ fileList.length }} 个文件，请稍后……</div>
    </el-dialog>
    <el-dialog title="读取中" center :close-on-click-modal="false" :close-on-press-escape="false" :visible="traversing"
      :show-close="false">
      <div>正在读取目标文件夹及子文件夹，已扫描 {{ traversed }} 个文件，其中 {{ fileList.length }} 个文件可转换，请稍后……</div>
    </el-dialog>
    <el-tabs class="main" type="card" tab-position="left" @tab-click="clear">
      <el-tab-pane>
        <span slot="label" class="clickable"><i class="fas fa-file-alt"></i> 选择文件</span>
        <div class="content">
          <div class="file-row">
            <el-upload class="clickable upload-area" drag action="" multiple :auto-upload="false" :on-change="handleFile"
              :show-file-list="false" :class="fileList.length != 0 ? 'upload-area-half' : ''">
              <i class="fas fa-music area-icon"></i>
              <div class="el-upload__text">将文件拖到此处，或<em>点击选择文件</em></div>
            </el-upload>
            <div v-if="fileList.length != 0" class="file-row-right">
              <div class="file-list-file">
                <el-scrollbar class="scrollable clickable">
                  <div v-for="(file, index) in fileList" :key="file.name" class="file">
                    <div class="file-name">{{ file.name + '.' + file.ext }}</div>
                    <div @click="handleDelete(index)">
                      <i class="fas fa-trash-alt file-delete"></i>
                    </div>
                  </div>
                </el-scrollbar>
              </div>
              <el-button type="primary" size="mini" @click="convert" class="clickable">开始转换文件格式</el-button>
            </div>
          </div>
          <div class="el-upload__tip" slot="tip">目前支持网易云音乐加密文件（ncm）和QQ音乐加密文件（qmc0, qmc3, qmcflac, qmcogg, mflac）。</div>
          <div class="subtitle">请选择存储位置</div>
          <div class="control-row">
            <el-switch v-model="customLocation" active-color="#66CCFF" inactive-color="#66CCFF" active-text="自定义路径"
              inactive-text="保存在原路径" class="clickable"></el-switch>
            <div class="control-row-space"></div>
            <el-input disabled size="mini" v-model="saveLocation" v-if="customLocation" class="positionInput clickable">
              <el-button @click="selectSaveFolder" slot="prepend">选择</el-button>
            </el-input>
          </div>
          <div class="subtitle">是否自动重命名</div>
          <div class="control-row">
            <div>根据文件标签中的信息，将转换后的文件重命名为“歌手 - 歌名”的格式</div>
            <el-switch v-model="autoRename" class="clickable control-rename"></el-switch>
            <div class="control-row-space"></div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label" class="clickable"><i class="fas fa-folder-open"></i> 选择文件夹</span>
        <div class="content">
          <div class="subtitle">请选择读取的文件夹</div>
          <div class="control-row">
            <el-switch v-model="childFolderIncluded" active-color="#66CCFF" inactive-color="#66CCFF" active-text="包含子目录"
              inactive-text="不包含子目录" class="clickable"></el-switch>
            <div class="control-row-space"></div>
            <el-input disabled size="mini" v-model="sourceLocation" class="positionInput clickable">
              <el-button @click="selectSourceFolder" slot="prepend">选择</el-button>
            </el-input>
          </div>
          <el-button v-if="fileList == 0" type="primary" size="mini" @click="handleFolder" class="clickable folder-button-full">读取文件夹</el-button>
          <div class="file-list-folder">
            <el-scrollbar v-if="fileList.length != 0" class="scrollable clickable">
              <div v-for="(file, index) in fileList" :key="file.name" class="file">
                <div class="file-name">{{ file.name + '.' + file.ext }}</div>
                <div @click="handleDelete(index)">
                  <i class="fas fa-trash-alt file-delete"></i>
                </div>
              </div>
            </el-scrollbar>
            <div v-else class="folder-empty">
              <i class="far fa-folder-open area-icon"></i>
              <div>未读取文件</div>
            </div>
          </div>
          <div v-if="fileList.length != 0">
            <div class="subtitle">请选择存储位置</div>
            <div class="control-row">
              <el-switch v-model="customLocation" active-color="#66CCFF" inactive-color="#66CCFF" active-text="自定义路径"
                inactive-text="保存在原路径" class="clickable"></el-switch>
              <div class="control-row-space"></div>
              <el-input disabled size="mini" v-model="saveLocation" v-if="customLocation" class="positionInput clickable">
                <el-button @click="selectSaveFolder" slot="prepend">选择</el-button>
              </el-input>
            </div>
            <div class="subtitle">是否自动重命名</div>
            <div class="control-row">
              <div>根据文件标签中的信息，将转换后的文件重命名为“歌手 - 歌名”的格式</div>
              <el-switch v-model="autoRename" class="clickable control-rename"></el-switch>
              <div class="control-row-space"></div>
            </div>
            <div class="folder-button-full">
              <el-button type="primary" size="mini" @click="convert" class="clickable folder-button">开始转换文件格式</el-button>
              <el-button type="primary" size="mini" @click="clear" class="clickable folder-button">清空文件列表</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane class="content">
        <span slot="label" class="clickable"><i class="fas fa-info-circle"></i> 使用说明</span>
        <div class="subtitle">本程序的功能</div>
        <div class="text">网易云音乐新版本下载的音乐及QQ音乐下载的VIP音乐为专有文件格式，在更换播放器或会员到期后将无法播放。本程序可以将上述软件的专有格式转换为通用音乐文件格式，可以在更换播放器或会员到期后继续使用。</div>
        <div class="subtitle">支持的格式</div>
        <div class="text">截至此版本发布时（2019年12月28日），本程序支持网易云音乐的专有格式文件（ncm）和QQ音乐旧版专有格式文件（qmc0, qmc3, qmcflac, qmcogg），并对QQ音乐新版专有无损格式文件(mflac)提供有限支持。</div>
        <div class="subtitle">法律声明</div>
        <div class="text">本程序仅供学习及研究上述软件的专有格式加密算法，相关音乐版权归原持有方所有。请勿使用本软件从事违法版权保护和计算机网络安全相关法律法规的行为，否则后果自行承担。</div>
        <div class="subtitle">开源信息</div>
        <div class="text">本程序使用MIT许可协议，可以<span @click="openWebsite('https://github.com/CNOliverZhang/Unlock-Music-Desktop/blob/master/LICENSE')" class="clickable">在此查看</span>协议文本。项目基于开源框架<span @click="openWebsite('https://simulatedgreg.gitbooks.io/electron-vue/cn/')" class="clickable">Electron-Vue</span>构建，核心解密及转码算法来源于<span @click="openWebsite('https://github.com/ix64/unlock-music')" class="clickable">unlock-music</span>。项目已托管在Github，可以<span @click="openWebsite('https://github.com/CNOliverZhang/Unlock-Music-Desktop/')" class="clickable">点此访问</span>。</div>
      </el-tab-pane>
      <el-tab-pane disabled></el-tab-pane>
      <el-tab-pane disabled>
        <div slot="label" class="control-button-container">
          <div class="control-button clickable" @click="minimize">
            <i class="fas fa-angle-double-down"></i>
            <div>最小化</div>
          </div>
          <div class="control-button clickable" @click="exit">
            <span class="fas fa-sign-out-alt"></span>
            <div>退出</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
  const ipcRenderer = require('electron').ipcRenderer
  const NcmDecrypt = require("./plugins/ncm")
  const QmcDecrypt = require("./plugins/qmc")
  const MFlacDecrypt = require("./plugins/mflac")
  const path = require('path')
  const fs = require('fs')
  const shell = require('electron').shell

  export default {
    name: 'app',
    data() {
      return {
        saveLocation: '',
        sourceLocation: '',
        customLocation: false,
        autoRename: true,
        fileList: [],
        converted: 0,
        failed: 0,
        converting: false,
        childFolderIncluded: false,
        traversing: false,
        traversed: 0,
      }
    },
    methods: {
      openWebsite(site) {
        shell.openExternal(site)
      },
      clear() {
        this.saveLocation = ''
        this.sourceLocation = ''
        this.customLocation = false
        this.fileList = []
        this.converted = 0
        this.failed = 0
        this.converting = false
        this.childFolderIncluded = false
        this.traversing = false
        this.traversed = 0
      },
      handleFile(file) {
        let ext = file.name.substring(file.name.lastIndexOf(".") + 1, file.name.length).toLowerCase()
        let name = file.name.substring(0, file.name.lastIndexOf("."))
        let path = file.raw.path.substring(0, file.raw.path.lastIndexOf("\\"))
        if (['ncm', 'qmc0', 'qmc3', 'qmcflac', 'qmcogg', 'mflac'].indexOf(ext) != -1) {
          (async (name, path, ext)=> {
            let fileBuffer = await new Promise(resolve => {
              let reader = new FileReader();
              reader.onload = (e) => {
                resolve(e.target.result);
              };
              reader.readAsArrayBuffer(file.raw);
            })
            this.fileList.push({
              fileBuffer: fileBuffer,
              path: path,
              name: name,
              ext: ext
            })
          })(name, path, ext)
        } else {
          this.$message.closeAll()
          this.$message.error({
            message: "文件“" + file.name + "”不可转换"
          })
        }
      },
      handleDelete(index) {
        this.fileList.splice(index, 1)
      },
      selectSourceFolder(type) {
        let that = this
        ipcRenderer.send('choose-source-folder')
        ipcRenderer.on('source-selected', function(event, path) {
          that.sourceLocation = path
        })
      },
      selectSaveFolder(type) {
        let that = this
        ipcRenderer.send('choose-save-folder')
        ipcRenderer.on('save-selected', function(event, path) {
          that.saveLocation = path
        })
      },
      convert() {
        let that = this
        if (that.customLocation && that.saveLocation == '') {
          that.$message.closeAll()
          that.$message.warning({
            message: "请选择保存的路径"
          })
          return
        }
        that.converting = true
        for (let i = 0; i < that.fileList.length; i++) {
          that.fileList[i].autoRename = that.autoRename;
          (async () => {
            let data = null
            let ext
            switch (that.fileList[i].ext) {
              case "ncm":
                data = await NcmDecrypt.Decrypt(that.fileList[i])
                break
              case "qmc3":
              case "qmc0":
              case "qmcflac":
              case "qmcogg":
                data = await QmcDecrypt.Decrypt(that.fileList[i]);
                break
              case "mflac":
                data = await MFlacDecrypt.Decrypt(that.fileList[i])
                break
            }
            if (data.success) {
              let path
              if (that.customLocation) {
                path = that.saveLocation + "\\" + data.filename
              } else {
                path = that.fileList[i].path + "\\" + data.filename
              }
              fs.writeFile(path, data.file, function() {
                that.converted += 1
                if (that.converted == that.fileList.length) {
                  that.converting = false
                  that.$message.closeAll()
                  that.$message.success({
                    message: "全部 " + that.fileList.length + " 个文件转换成功",
                    onClose: function() {
                      that.clear()
                    }
                  })
                } else if ((that.converted + that.failed) == that.fileList.length) {
                  that.converting = false
                  that.$message.closeAll()
                  that.$message.warning({
                    message: that.converted + " 个文件转换成功，另有 " + that.failed + " 个转换失败",
                    onClose: function() {
                      that.clear()
                    }
                  })
                }
              })
            } else {
              that.failed += 1
              that.$message.closeAll()
              that.$message.error({
                message: "文件“" + data.filename + "”转换失败，" + data.message
              })
              if (that.failed == that.fileList.length) {
                that.converting = false
                that.$message.closeAll()
                that.$message.error({
                  message: "全部 " + that.fileList.length + " 个文件转换失败",
                  onClose: function() {
                    that.clear()
                  }
                })
              } else if ((that.converted + that.failed) == that.fileList.length) {
                that.converting = false
                that.$message.closeAll()
                that.$message.warning({
                  message: that.converted + " 个文件转换成功，另有 " + that.failed + " 个转换失败",
                  onClose: function() {
                    that.clear()
                  }
                })
              }
            }
          })()
        }
      },
      handleFolder() {
        let that = this
        if (that.sourceLocation == '') {
          that.$message.closeAll()
          that.$message.warning({
            message: "请选择读取的目录"
          })
          return
        }
        if (that.childFolderIncluded) {
          that.traversing = true
          let dirList = [];
          (function traverse(directory, dirList) {
            fs.readdir(directory, function(e, files) {
              if (e) {
                that.$message.closeAll()
                that.$message.error({
                  message: "读取文件夹" + path + "错误"
                })
              } else {
                for (let i = 0; i < files.length; i++) {
                  let filename = files[i]
                  try {
                    that.traversed += 1
                    let filepath = path.join(directory, filename)
                    let stats = fs.statSync(filepath)
                    if (stats.isFile()) {
                      that.traversed += 1
                      let file = fs.readFileSync(filepath)
                      let ext = filename.substring(filename.lastIndexOf(".") + 1, filename.length).toLowerCase()
                      let name = filename.substring(0, filename.lastIndexOf("."))
                      let path = directory
                      if (['ncm', 'qmc0', 'qmc3', 'qmcflac', 'qmcogg', 'mflac'].indexOf(ext) != -1) {
                        (async (name, path, ext)=> {
                          let fileBuffer = await new Promise(resolve => {
                            let reader = new FileReader();
                            reader.onload = (e) => {
                              resolve(e.target.result);
                            };
                            reader.readAsArrayBuffer(new Blob([file.buffer]));
                          })
                          that.fileList.push({
                            fileBuffer: fileBuffer,
                            path: path,
                            name: name,
                            ext: ext
                          })
                        })(name, path, ext);
                      }
                    } else {
                      dirList.push(filepath)
                    }
                  } catch(e) {
                  }
                }
                if (dirList.length != 0) {
                  traverse(dirList.pop(), dirList)
                } else {
                  that.traversing = false
                  that.traversed = 0
                  that.$message.closeAll()
                  that.$message.success({
                    message: "已扫描完成所选择的文件夹及子文件夹"
                  })
                }
              }
            })
          })(that.sourceLocation, dirList);
        } else {
          that.traversing = true
          fs.readdir(that.sourceLocation, function(e, files) {
            if (e) {
              that.$message.closeAll()
              that.$message.error({
                message: "读取文件夹错误"
              })
            } else {
              for (let i = 0; i < files.length; i++) {
                let filename = files[i]
                let filepath = path.join(that.sourceLocation, filename)
                fs.stat(filepath, function(err, stats) {
                  if (stats.isFile) {
                    that.traversed += 1
                    fs.readFile(filepath, function(error, file) {
                      let ext = filename.substring(filename.lastIndexOf(".") + 1, filename.length).toLowerCase()
                      let name = filename.substring(0, filename.lastIndexOf("."))
                      let path = that.sourceLocation
                      if (['ncm', 'qmc0', 'qmc3', 'qmcflac', 'qmcogg', 'mflac'].indexOf(ext) != -1) {
                        (async (name, path, ext)=> {
                          let fileBuffer = await new Promise(resolve => {
                            let reader = new FileReader();
                            reader.onload = (e) => {
                              resolve(e.target.result);
                            };
                            reader.readAsArrayBuffer(new Blob([file.buffer]));
                          })
                          that.fileList.push({
                            fileBuffer: fileBuffer,
                            path: path,
                            name: name,
                            ext: ext
                          })
                        })(name, path, ext)
                      }
                    })
                  }
                })
              }
              that.traversing = false
              that.traversed = 0
              that.$message.closeAll()
              that.$message.success({
                message: "已扫描完成所选择的文件夹"
              })
            }
          })
        }
      },
      minimize() {
        ipcRenderer.send('minimize')
      },
      exit() {
        ipcRenderer.send('exit')
      }
    }
  }
</script>

<style>
  @font-face {
    font-family: SourceHanSansSC;
    src: url('./assets/SourceHanSansSC-ExtraLight.otf');
  }

  body {
    margin: 0;
    border: 0;
    width: 100vw;
    height: 100vh;
    font-family: "SourceHanSansSC";
    cursor: default;
    -webkit-app-region: drag;
    user-select: none;
  }

  button {
    font-family: "SourceHanSansSC";
  }

  #app {
    width: 100%;
    height: 100%;
  }

  .clickable {
    -webkit-app-region: no-drag;
  }

  .main {
    width: 100%;
    height: 100%;
  }

  .el-tabs__nav-scroll {
    background-color: #F5F7FA;
  }

  .el-tabs__nav {
    border: 0 !important;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .el-tabs__header {
    margin: 0 !important;
  }

  .el-tabs__item.is-left {
    width: 150px;
    height: 50px;
    line-height: 50px;
    text-align: center !important;
    border: 0 !important;
    color: #495057;
  }

  .el-tabs__item.is-active {
    background-color: #FFFFFF;
  }

  .el-tabs__item.is-disabled:not(:last-child) {
    flex-grow: 1;
  }

  .el-tabs__item:last-child {
    height: 80px !important;
    padding: 0;
  }

  .control-button-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    padding: 5px;
    box-sizing: border-box;
  }

  .control-button {
    height: 100%;
    width: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    line-height: 20px;
    font-size: 12px;
    text-align: center;
    cursor: pointer;
    transition: 0.2s;
  }

  .control-button svg {
    font-size: 15px;
  }

  .control-button:hover {
    color: #66CCFF;
  }

  .control-button:active {
    color: #66CCFF;
    filter: brightness(0.9);
  }

  .content {
    padding: 20px;
  }

  .file-row {
    width: 100%;
    height: 220px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .upload-area {
    width: 100%;
    height: 100%;
    transition: 0.5s;
  }

  .upload-area-half {
    width: 49%;
  }

  .el-upload {
    width: 100% !important;
    height: 100% !important;
  }

  .el-upload-dragger {
    width: 100% !important;
    height: 100% !important;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  
  .el-upload__tip {
    margin-bottom: 10px;
  }

  .file-row-right {
    width: 49%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .file-list-file {
    width: 100%;
    height: 200px;
    background-color: #F5F7FA;
    margin-bottom: 10px;
    box-sizing: border-box;
    border-radius: 6px;
    border-color: #DCDFE6;
    border-style: solid;
    border-width: 1px;
    overflow: hidden;
  }
  
  .file-list-folder {
    width: 100%;
    height: 200px;
    background-color: #F5F7FA;
    margin-bottom: 10px;
    box-sizing: border-box;
    border-radius: 6px;
    border-color: #DCDFE6;
    border-style: solid;
    border-width: 1px;
    overflow: hidden;
  }

  .file {
    height: 28px;
    width: 100%;
    line-height: 24px;
    font-size: 12px;
    padding-left: 5px;
    padding-right: 5px;
    box-sizing: border-box;
    background-color: #FFFFFF;
    border-bottom-color: #DCDFE6;
    border-bottom-style: solid;
    border-bottom-width: 1px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .file:hover {
    background-color: #F5F7FA;
  }

  .file-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex-grow: 1;
  }

  .file-delete {
    color: #DCDFE6;
    cursor: pointer;
  }

  .file-delete:hover {
    color: #F56C6C;
  }

  .scrollable {
    width: 100%;
    height: 100%;
  }

  .el-scrollbar__wrap {
    overflow-x: hidden !important;
  }

  .subtitle {
    font-size: 18px;
  }
  
  .text {
    font-size: 14px;
    text-indent: 2em;
    margin-top: 10px;
    margin-bottom: 10px;
    text-align: justify;
  }
  
  .text span {
    color: #66CCFF;
    cursor: pointer;
  }

  .control-row {
    height: 28px;
    font-size: 14px;
    margin-top: 10px;
    margin-bottom: 10px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .control-row-space {
    flex-grow: 1;
  }
  
  .control-rename {
    margin-left: 10px;
  }

  .positionInput {
    width: 60% !important;
  }
  
  .folder-button-full {
    margin-top: 10px!important;
    margin-bottom: 10px!important;
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  
  .folder-button {
    width: 49%;
  }
  
  .folder-empty {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-size: 14px;
    color: #606266;
  }
  
  .area-icon {
    color: #495057;
    font-size: 50px;
    margin: 20px;
  }
</style>
