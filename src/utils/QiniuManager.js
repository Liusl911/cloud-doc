const qiniu = require('qiniu')
const axios = require('axios')
const fs = require('fs')
const { resolve } = require('path')

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

    // 删除文件
    deleteFile(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.delete(this.bucket, key, this._handleCallback(resolve, reject));
        })
    }

    // 重命名文件
    renameFile(oldKey, newKey) {
        // 强制覆盖已有同名文件
        const options = {
            force: true
        }
        return new Promise((resolve, reject) => {
            this.bucketManager.move(this.bucket, oldKey, this.bucket, newKey, options, this._handleCallback(resolve, reject));
        })
    }

    // 获取文件信息
    getStat(key) {
        return new Promise((resolve, reject) => {
            this.bucketManager.stat(this.bucket, key, this._handleCallback(resolve, reject));
        })
    }

    // 下载地址
    getBucketDomain() {
        const reqUrl = `http://uc.qbox.me/v2/domains?tbl=${this.bucket}`;
        const digest = qiniu.util.generateAccessToken(this.mac, reqUrl);
        console.log('trigger here')
        return new Promise((resolve, reject) => {
            qiniu.rpc.postWithoutForm(reqUrl, digest, this._handleCallback(resolve, reject));
        })
    }
    generateDownloadLink(key) {
        const domainPromise = this.publicBucketDomain ? Promise.resolve([this.publicBucketDomain]) : this.getBucketDomain();
        return domainPromise.then(res => {
            if (Array.isArray(res) && res.length > 0) {
                const pattern = /^https?/;
                this.publicBucketDomain = pattern.test(res[0]) ? res[0] : `http://${res[0]}`;
                return this.bucketManager.publicDownloadUrl(this.publicBucketDomain, key);
            } else {
                throw Error('域名未找到，请查看存储空间是否已经过期')
            }
        })
    }
    downloadFile(key, downloadPath) {
        return this.generateDownloadLink(key).then(link => {
            const timeStamp = new Date().getTime();
            const url = `${link}?${timeStamp}`;
            return axios({
                url,
                method: 'GET',
                responseType: 'stream',
                headers: { 'Cache-Control': 'no-cache' }
            })
        }).then(response => {
            const writer = fs.createWriteStream(downloadPath)
            response.data.pipe(writer)
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve({ key: key, path: downloadPath }))
                writer.on('error', reject)
            })
        }).catch(err => {
            return Promise.reject({ err: err.response })
        })
    }

    filesListPrefix() {
        const options = {
            limit: 10,
            prefix: '',
        }
        return new Promise((resolve, reject) => {
            this.bucketManager.listPrefix(this.bucket, options, this._handleCallback(resolve, reject));
        })
    }
}

module.exports = QiniuManager