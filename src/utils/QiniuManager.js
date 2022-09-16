const qiniu = require('qiniu')

class QiniuManager {
    constructor(accessKey, secretKey, bucket) {
        // generate mac
        this.mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
        this.bucket = bucket

        // init config class
        this.config = new qiniu.conf.Config()
        // 空间对应的机房
        this.config.zone = qiniu.zone.Zone_z0

        this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config)
    }

    // 敲黑板，此乃高阶函数~~
    _handleCallback(resolve, reject) {
        return (respErr, respBody, respInfo) => {
            if (respErr) {
                throw respErr
            }
            if (respInfo.statusCode === 200) {
                resolve(respBody)
            } else {
                reject({
                    statusCode: respInfo.statusCode,
                    body: respBody
                })
            }
        }
    }

    uploadFile(key, localFilePath) {
        // generate uploader token
        const options = {
            scope: this.bucket + ":" + key, // 强制覆盖已上传的文件
        };
        const putPolicy = new qiniu.rs.PutPolicy(options)
        const uploadToken = putPolicy.uploadToken(this.mac)
        const formUploader = new qiniu.form_up.FormUploader(this.config)
        const putExtra = new qiniu.form_up.PutExtra()
        return new Promise((resolve, reject) => {
            // 文件上传
            formUploader.putFile(uploadToken, key, localFilePath, putExtra, this._handleCallback(resolve, reject));
        })
    }

    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handleCallback(resolve, reject));
        })
    }
}

module.exports = QiniuManager