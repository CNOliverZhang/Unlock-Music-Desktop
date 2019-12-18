<template>
  <div id="app">
    <el-dialog title="转换进度" center :close-on-click-modal="false" :close-on-press-escape="false" :visible="converting"
      :show-close="false">
      <div class="dialog-text">正在转换第 {{ converted + 1}} 个文件，共 {{ total }} 个文件，请稍后……</div>
      <div class="dialog-progress">
        <el-progress type="circle" :percentage="Math.floor((converted / total) * 100)"></el-progress>
      </div>
    </el-dialog>
    <el-tabs class="main" type="card" tab-position="left" @tab-click="clear">
      <el-tab-pane>
        <span slot="label" class="clickable"><i class="fas fa-file-alt"></i> 选择文件</span>
        <div class="content">
          <div class="file-row">
            <el-upload class="clickable upload-area" drag action="" multiple :auto-upload="false" :on-change="handleFile"
              :show-file-list="false" :class="fileList.length != 0 ? 'upload-area-half' : ''">
              <i class="fas fa-music"></i>
              <div class="el-upload__text">将文件拖到此处，或<em>点击选择文件</em></div>
            </el-upload>
            <div v-if="fileList.length != 0" class="file-row-right">
              <div class="file-list">
                <el-scrollbar class="scrollable clickable">
                  <div v-for="(file, index) in fileList" :key="file.file.name" class="file">
                    <div class="file-name">{{ file.file.name }}</div>
                    <div @click="handleDelete(index)">
                      <i class="fas fa-trash-alt file-delete"></i>
                    </div>
                  </div>
                </el-scrollbar>
              </div>
              <el-button type="primary" size="mini" @click="convert" class="clickable">开始转换文件格式</el-button>
            </div>
          </div>
          <div class="el-upload__tip" slot="tip">目前支持网易云音乐加密文件(ncm)和QQ音乐加密文件(qmc0, qmc3, qmcflac, qmcogg, mflac)。</div>
          <div class="subtitle">请选择存储位置</div>
          <div class="control-row">
            <el-switch v-model="customLocation" active-color="#66CCFF" inactive-color="#66CCFF" active-text="自定义路径"
              inactive-text="保存在原路径" class="clickable"></el-switch>
            <div class="control-row-space"></div>
            <el-input disabled size="mini" v-model="saveLocation" v-if="customLocation" class="positionInput clickable">
              <el-button @click="selectSaveFolder" slot="prepend">选择</el-button>
            </el-input>
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
          <div class="subtitle">请选择存储位置</div>
          <div class="control-row">
            <el-switch v-model="customLocation" active-color="#66CCFF" inactive-color="#66CCFF" active-text="自定义路径"
              inactive-text="保存在原路径" class="clickable"></el-switch>
            <div class="control-row-space"></div>
            <el-input disabled size="mini" v-model="saveLocation" v-if="customLocation" class="positionInput clickable">
              <el-button @click="selectSaveFolder" slot="prepend">选择</el-button>
            </el-input>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane>
        <span slot="label" class="clickable"><i class="fas fa-info-circle"></i> 使用说明</span>
        <div class="content">我的行程</div>
      </el-tab-pane>
      <el-tab-pane disabled></el-tab-pane>
      <el-tab-pane disabled>
        <div slot="label" class="control-button-container">
          <div class="control-button clickable" @click="minimize">
            <i class="fas fa-angle-double-down"></i>
            <div>最小化</div>
          </div>
          <div class="control-button clickable" @click="exit">
            <i class="fas fa-sign-out-alt"></i>
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

  export default {
    name: 'app',
    data() {
      return {
        saveLocation: '',
        sourceLocation: '',
        customLocation: false,
        fileList: [],
        converted: 0,
        total: 0,
        converting: false,
        childFolderIncluded: true
      }
    },
    methods: {
      clear() {
        this.saveLocation = ''
        this.sourceLocation = ''
        this.customLocation = false
        this.fileList = []
      },
      handleFile(file) {
        let ext = file.name.substring(file.name.lastIndexOf(".") + 1, file.name.length).toLowerCase()
        let name = file.name.substring(0, file.name.lastIndexOf("."))
        let path = file.raw.path.substring(0, file.raw.path.lastIndexOf("\\"))
        if (['ncm', 'qmc0', 'qmc3', 'qmcflac', 'qmcogg', 'mflac'].indexOf(ext) != -1) {
          this.fileList.push({
            file: file,
            path: path,
            name: name,
            ext: ext
          })
          this.total += 1
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
          that.$message({
            message: "请选择保存的路径",
            type: "warning"
          })
          return
        }
        that.converting = true
        for (let i = 0; i < that.fileList.length; i++) {
          (async () => {
            let data = null
            let ext
            switch (that.fileList[i].ext) {
              case "ncm":
                data = await NcmDecrypt.Decrypt(that.fileList[i].file.raw)
                break
              case "qmc3":
              case "qmc0":
              case "qmcflac":
              case "qmcogg":
                data = await QmcDecrypt.Decrypt(that.fileList[i].file.raw);
                break
              case "mflac":
                data = await MFlacDecrypt.Decrypt(that.fileList[i].file.raw)
                break
            }
            if (data) {
              let path
              if (that.customLocation) {
                path = that.saveLocation + "\\" + data.filename
              } else {
                path = that.fileList[i].path + "\\" + data.filename
              }
              fs.writeFile(path, data, function() {
                that.converted += 1
                if (that.converted == that.total) {
                  that.converting = false
                  that.$message({
                    message: "全部文件转换完成",
                    type: "success"
                  })
                  that.clear()
                }
              })
            }
          })()
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

  .dialog-text {
    margin-bottom: 20px;
  }

  .dialog-progress {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
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
  
  .el-upload svg {
    color: #495057;
    font-size: 50px;
    margin: 20px;
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
    height: 320px;
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

  .el-upload-dragger i {
    margin: 20px !important;
  }

  .file-row-right {
    width: 49%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .file-list {
    width: 100%;
    height: 300px;
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
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .control-row {
    height: 28px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .control-row-space {
    flex-grow: 1;
  }

  .positionInput {
    width: 60% !important;
  }
</style>
