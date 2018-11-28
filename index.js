const LCUConnector = require('lcu-connector');
const connector = new LCUConnector('');
var request = require('request-promise');
var fs = require('fs');
const btoa = require('btoa');

console.log('Waiting for LeagueClient to start');


// var content = 'Nội dung này tôi muốn ghi vào file writer.html';
// //sử dụng phương thức writeFile để ghi nội dung vào file
// fs.writeFile('writer.json',content,'utf8',function (err) {
//     //Kiểm tra nếu có lỗi thì xuất ra lỗi
//     if(err)
//         throw err;
//     else //nếu không thì hiển thị nội dung ghi file thành công
//         console.log('Ghi file thanh cong!');
// });

recurring = (endpoint) => {
  if (!process.env.should_run) return new Promise();

  return request.put(endpoint, {
    body: {
      availability: 'offline'
    },
  })
  .then(res => {
    if (!res.name) return;
    return setTimeout(() => recurring(endpoint), 1000);
  })
  .catch(err => {
    return setTimeout(() => recurring(endpoint), 5000);
  });
}

account_fetch = (endpoint) => {
  if (!process.env.should_run) return new Promise();

  return request.get(endpoint)
  .then(res => {
    if (!res.name) return;
    console.log(`Account ${res.name} found, changed online status to offline`);

    fs.writeFile('writer.json',JSON.stringify(res),'utf8',function (err) {
    //Kiểm tra nếu có lỗi thì xuất ra lỗi
    if(err)
      throw err;
    else //nếu không thì hiển thị nội dung ghi file thành công
      console.log('Ghi file thanh cong!');
  });
    recurring(endpoint);
  })
  .catch(err => {
    console.log('Get account info error, retrying...');
    return setTimeout(() => account_fetch(endpoint), 5000);
  });
}

connector.on('connect', (data) => {
  console.log('LeagueClient found!');

  let { protocol, address, port, username, password } = data;
  let url = `${protocol}://${address}:${port}`;
  let endpoint = `${url}/lol-chat/v1/me`;
  let authorization = btoa(`${username}:${password}`);

  process.env.should_run = true;

  request = request.defaults({
    headers: {
      Authorization: 'Basic '+authorization
    },
    strictSSL: false,
    json: true
  });
  account_fetch(endpoint);
});

connector.on('disconnect', () => {
  process.env.should_run = false;
});

connector.start();