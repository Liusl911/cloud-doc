const QiniuManager = require('./src/utils/QiniuManager')
const path = require('path')

const accessKey = 'Nfm5M6CrGWDufHAV8mAHeKOT0pBo5hKd4coKyhFQ';
const secretKey = 'FnlDS86PxLb1-xzD9B2Tb5jKKkySr3EvnOeCoYgr';
const localFile = "/Users/Inno-web/Desktop/markdown文件暂存区/qn-3.md";
const bucketName = "liusl-clouddoc"
const key = 'qn-3.md';
const downloadPath = path.join(__dirname, key)

const manager = new QiniuManager(accessKey, secretKey, bucketName)
// manager.uploadFile(key, localFile).then(res => {
//     console.log(res)
//     return manager.deleteFile(key)
// }).then((res) => {
//     console.log(res)
// })
// manager.deleteFile(key)

// manager.generateDownloadLink(key).then(res => {
//     console.log(res)
//     return manager.generateDownloadLink('qn-2.md')
// }).then(res => {
//     console.log(res)
// })

manager.downloadFile(key, downloadPath).then(() => {
    console.log('下载写入文件完毕')
}).catch(err => {
    console.error(err)
})
