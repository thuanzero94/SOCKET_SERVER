const PORT = 3484;  //Đặt địa chỉ Port được mở ra để tạo ra chương trình mạng Socket Server

var http = require('http'); //#include thư viện http - Tìm thêm về từ khóa http nodejs trên google nếu bạn muốn tìm hiểu thêm. Nhưng theo kinh nghiệm của mình, Javascript trong môi trường NodeJS cực kỳ rộng lớn, khi bạn bí thì nên tìm hiểu không nên ngồi đọc và cố gắng học thuộc hết cái reference (Tài liêu tham khảo) của nodejs làm gì. Vỡ não đó!
var express = require('express'); //#include thư viện express - dùng để tạo server http nhanh hơn thư viện http cũ
var socketio = require('socket.io'); //#include thư viện socketio

var ip = require('ip');
var app = express();
var server = http.Server(app); //#Khởi tạo một chương trình mạng (app)

var io = socketio(server); //#Phải khởi tạo io sau khi tạo app!

var webapp_nsp = io.of('/webapp');  //Namespace of webapp
var esp8266_nsp = io.of('/esp8266'); //Namespace of ESP8266

var middleware = require('socketio-wildcard')(); //Để có thể bắt toàn bộ lệnh!
esp8266_nsp.use(middleware); //Khi esp8266 emit bất kỳ lệnh gì lên thì sẽ bị bắt
webapp_nsp.use(middleware); //Khi webapp emit bất kỳ lệnh gì lên thì sẽ bị bắt

server.listen(process.env.PORT || PORT); // Cho socket server (chương trình mạng) lắng nghe ở port 3484
console.log("Server nodejs chay tai dia chi: " + ip.address() + ":" + PORT)

//Setup data for static web
app.use(express.static("node_modules/mobile-angular-ui"));
app.use(express.static("node_modules/angular"));
app.use(express.static("node_modules/angular-route"));
app.use(express.static("node_modules/socket.io-client"));
app.use(express.static("node_modules/angular-socket-io"));
app.use(express.static("webapp"));

//giải nén chuỗi JSON thành các OBJECT
function ParseJson(jsondata) {
    try {
        return JSON.parse(jsondata);
    } catch (error) {
        return null;
    }
}


//Listen Events from ESP8266
esp8266_nsp.on("connection", function(socket){
    console.log("ESP8266 Connected")

    socket.on("disconnect", function(){
        console.log("ESP8266 Disconnected")        
    })  

    socket.on("*", function(packet){
        console.log("ESP8266 receive and send to Webapp packet: ", packet.data)
        var eventName = packet.data[0]
        var eventJson = packet.data[1]||{} //nếu gửi thêm json thì lấy json từ lệnh gửi, không thì gửi chuỗi json rỗng, {}
        webapp_nsp.emit(eventName, eventJson) //gửi toàn bộ lệnh + json đến webapp
    })  
})


//Listen Events from Webapp
webapp_nsp.on('connection', function(socket) {
    
    console.log('Webapp Connected')
    
    //Khi webapp socket bị mất kết nối
    socket.on('disconnect', function() {
        console.log("Webapp Disconnected")
    })
    
    socket.on('*', function(packet) {
        console.log("Webapp rev and send to ESP8266 packet: ", packet.data) //in ra để debug
        var eventName = packet.data[0]
        var eventJson = packet.data[1] || {} //nếu gửi thêm json thì lấy json từ lệnh gửi, không thì gửi chuỗi json rỗng, {}
        esp8266_nsp.emit(eventName, eventJson) //gửi toàn bộ lệnh + json đến esp8266
    });
})

/*//Gửi dữ liệu thông qua 
function sendTime() {
    //Đây là một chuỗi JSON
    var json = {
        alan: "ESP8266 Alan", //kiểu chuỗi
        ESP8266: 12, //số nguyên
        soPi: 3.14, //số thực
        time: new Date() //Đối tượng Thời gian
    }
    io.sockets.emit('atime', json);
}

//Khi có 1 kết nối được tạo giữa Socket Client và Socket Server
io.on('connection', function(socket) {
    //hàm console.log giống như hàm Serial.println trên Arduino
    console.log("Connected"); //In ra màn hình console là đã có một Socket Client kết nối thành công.
    
    //   Demo Send, Get Data
     
    //Gửi đi lệnh 'welcome' với một tham số là một biến JSON. Trong biến JSON này có một tham số và tham số đó tên là message. Kiểu dữ liệu của tham số là một chuối.
    socket.emit('welcome', {
        message: 'Connected !!!!'
    });
    //Khi lắng nghe được lệnh "connection" với một tham số, và chúng ta đặt tên tham số là message. Mình thích gì thì mình đặt thôi.
    //'connection' (2)
    socket.on('connection', function(message) {
        console.log(message);
    });
    //khi lắng nghe được lệnh "atime" với một tham số, và chúng ta đặt tên tham số đó là data. Mình thích thì mình đặt thôi
    socket.on('atime', function(data) {
        sendTime();
        console.log(data);
    });
    socket.on('arduino', function(data) {
        io.sockets.emit('arduino', {
            message: 'R0'
        });
        console.log(data);
    });
    
     // Control LED
    
    var led = [true, false] //định nghĩa một mảng 1 chiều có 2 phần tử: true, false. Mảng này sẽ được gửi đi nhằm thay đổi sự sáng tắt của 2 con đèn LED đỏ và xanh. Dựa vào cài đặt ở Arduino mà đèn LEd sẽ bị bật hoặc tắt. Hãy thử tăng hoạt giảm số lượng biến của mảng led này xem. Và bạn sẽ hiểu điều kỳ diệu của JSON!
    //Tạo một chu kỳ nhiệm vụ sẽ chạy lại sau mỗi 200ms
    var interval1 = setInterval(function() {
        //đảo trạng thái của mảng led, đảo cho vui để ở Arduino nó nhấp nháy cho vui.
        for (var i = 0; i < led.length; i++) {
            led[i] = !led[i]
        }
        //Cài đặt chuỗi JSON, tên biến JSON này là json 
        var json = {
            "led": led //có một phần tử là "led", phần tử này chứa giá trị của mảng led.
        }
        socket.emit('LED', json) //Gửi lệnh LED với các tham số của của chuỗi JSON
        console.log("send LED") //Ghi ra console.log là đã gửi lệnh LED
    }, 200) //200ms
    //Khi socket client bị mất kết nối thì chạy hàm sau.
    socket.on('disconnect', function() {
        console.log("disconnect"); //in ra màn hình console cho vui
        clearInterval(interval1); //xóa chu kỳ nhiệm vụ đi, chứ không xóa là cái task kia cứ chạy mãi thôi đó!
    });
});*/