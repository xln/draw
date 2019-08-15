const express = require('express');
const app = express();
const fs = require("fs");
const path = require('path');
const opn = require('opn')
const bodyParser = require('body-parser');
const archiver = require('archiver');
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/imgs',express.static(path.join(__dirname, 'imgs')));
app.get('/', function (req, res) {
    const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf-8');
    res.send(html);
});
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,params");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
app.get('/fetchPic', function (req, res) {
    res.json(findSync('./imgs'));
});
app.post('/emptyAwardDirectory',function(req, res){
    var fileUrl = './drawnamelist';
    var files = fs.readdirSync(fileUrl);//读取该文件夹
    files.forEach(function(file){
        var stats = fs.statSync(fileUrl+'/'+file);
        if(stats.isDirectory()){
            emptyDir(fileUrl+'/'+file);
            console.log(emptyDir(fileUrl+'/'+file),2333);
        }else{
            fs.unlinkSync(fileUrl+'/'+file);
            console.log("删除文件"+fileUrl+'/'+file+"成功");
        }
    });
    res.json({msg:"删除完成",status:0})
})
app.get('/download',function (req, res){
    const output = fs.createWriteStream('./drawnamelist.zip');
    var archive = archiver('zip', {zlib: { level: 9 }});
    output.on('close', function(e) {
        console.log(archive.pointer() + ' total bytes');
        res.download("./drawnamelist.zip");
    });
    output.on('end', function() {
        console.log('Data has been drained');
    });
    archive.on('warning', function(err) {
        if (err.code === 'ENOENT') {
        } else {
            throw err;
        }
    });
    archive.on('error', function(err) {
        throw err;
    });
    archive.pipe(output);
    archive.directory('./drawnamelist');
    archive.glob('./drawnamelist/*.txt');
    archive.finalize();
});
app.post('/save', function (req, res) {
    if(req.body.data.length==0){
        res.json({msg:"名单为空",status:-1});
        return;
    }
    let writeList = (path)=>{
        fs.exists('./drawnamelist/'+path+'.txt', function (exists) {
            if(exists){
                let arr = path.replace(/.txt/,'').split('_');
                writeList(arr[0]+'_'+(arr.length>1?parseInt(arr[1])+1:1));
            }else{
                fs.writeFile('./drawnamelist/'+path+'.txt', JSON.stringify(req.body.data), function(err) {
                    if (err) {
                        return console.error(err);
                    }
                    console.log(path+"写入成功！");
                    res.json({msg:path+"写入成功！",status:0});
                })
            }
        });
    }
    writeList(req.body.awardName);
});
var server = app.listen(3333, function () {
    var port = server.address().port;
    console.log('Example app listening at http://localhost:'+ port);
    opn('http://localhost:'+ port);
});

function findSync(startPath) {
    let result=[];
    function finder(path) {
        let files=fs.readdirSync(path);
        files.forEach((val,index) => {
            let fPath=`${path}/${val}`;
        let stats=fs.statSync(fPath);
        if(stats.isDirectory()) finder(fPath);
        if(stats.isFile()) result.push(fPath);
    });
    }
    finder(startPath);
    return result;
}
