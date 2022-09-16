const QiniuManager = require('./src/utils/QiniuManager')

const accessKey = 'Nfm5M6CrGWDufHAV8mAHeKOT0pBo5hKd4coKyhFQ';
const secretKey = 'FnlDS86PxLb1-xzD9B2Tb5jKKkySr3EvnOeCoYgr';
const localFile = "/Users/Inno-web/Desktop/markdown文件暂存区/qn-3.md";
const bucketName = "liusl-clouddoc"
const key = 'qn-3.md';

var publicBucketDomain = 'http://riam0t2fr.hd-bkt.clouddn.com';

// 公开空间访问链接
// var publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, key);
// console.log(publicDownloadUrl);

const manager = new QiniuManager(accessKey, secretKey, bucketName)
manager.uploadFile(key, localFile).then(res => {
    console.log(res)
    return manager.deleteFile(key)
}).then((res) => {
    console.log(res)
})
// manager.deleteFile(key)