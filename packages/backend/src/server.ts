import * as fs from "fs";
import { default as Express } from "express";
import * as path from "path";
import { default as favicon } from "serve-favicon";
import * as Https from "https";
import { networkInterfaces } from "os";
import dotenv from "dotenv";
dotenv.config();

import { writeOutLog } from "./util/writeOutLog";
import { setFreq } from "../../util/setFreq"

// import WebSocket, { WebSocketServer } from "ws";

// interface Client {
//   id: string;
//   socket: WebSocket;
// }

interface GpsData {
  timestamp: Date;
  latitude: number;
  longitude: number;
  nearbyId?: string;
}
interface GpsObject {
  [key: string]: GpsData[];
}

const gpsObj: GpsObject = {};

const originGps = {
  latitude: Number(process.env.ORIGIN_LAT),
  longitude: Number(process.env.ORIGIN_LON),
};

const port = process.env.PORT || 8808;

const app = Express();
app.use(Express.json());

app.use(Express.static(path.join(__dirname, "..", "static")));
app.use(favicon(path.join(__dirname, "..", "lib/favicon.ico")));

// const allowCrossDomain = function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Content-Type, Authorization, access_token"
//   );
//   // intercept OPTIONS method
//   if ("OPTIONS" === req.method) {
//     res.sendStatus(200);
//   } else {
//     next();
//   }
// };
// app.use(allowCrossDomain);

//const httpsserver = Https.createServer(options,app).listen(port);
const options = {
  key: fs.readFileSync(
    // path.join(__dirname, "../../../..", "keys/chat/private.key")
    path.join(__dirname, "../../../..", "keys/parkconcert/privkey.pem")
  ),
  cert: fs.readFileSync(
    // path.join(__dirname, "../../../..", "keys/chat/selfsigned.crt")
    path.join(__dirname, "../../../..", "keys/parkconcert/fullchain.pem")
  ),
  passphrase: "chat",
};

const httpserver = Https.createServer(options, app);

function getIpAddress() {
  const nets = networkInterfaces();
  const net = nets["en0"]?.find((v) => v.family == "IPv4");
  return !!net ? net.address : null;
}

const host = getIpAddress() || "localhost";
console.log(`Server listening on ${host}:${port}`);

// const io: SocketIO.Server = ioServer(httpserver);
// const wss = new WebSocketServer({ server: httpserver });

// wss.on("connection", function connection(ws) {
//   let clientId: string | undefined;

//   ws.on("open", () => {
//     console.log("websocket open");
//   });
//   ws.on("error", (err) => {
//     console.log(err);
//   });
//   ws.on("message", function incoming(message) {
//     console.log("received: %s", message);
//     const parsedMessage = JSON.parse(message.toString());
//     console.log(parsedMessage);

//     // 初回接続時にIDを受信した場合、そのIDをセットする
//     if (parsedMessage.type === "register") {
//       if (parsedMessage.id !== "server") {
//         clientId = parsedMessage.id;
//         const existingClient = clients.find((client) => client.id === clientId);

//         if (existingClient) {
//           // 既存クライアントの再接続時にWebSocketオブジェクトを更新
//           existingClient.socket = ws;
//           console.log(`same Client reconnected: ${clientId}`);
//         } else {
//           // 新規クライアントとして登録
//           clients.push({ id: clientId, socket: ws });
//           console.log(`New client connected: ${clientId}`);
//         }
//         console.log("clients", clients);
//       } else {
//         localServer = { id: "server", socket: ws };
//         console.log(localServer);
//       }
//     }
//   });

//   ws.on("close", function close() {
//     clients.filter((client) => client.socket !== ws);
//     console.log("disconnected, clients length:", clients.length);
//   });

//   setInterval(() => {
//     clients.forEach((client, index, array) => {
//       if (client.socket.readyState !== client.socket.OPEN) {
//         array.splice(index, 1);
//         console.log("disconnected");
//         console.log(clients.map((client) => client.id));
//         // clearInterval(checkInterval);
//       } else {
//         try {
//           client.socket.ping();
//         } catch (error) {
//           console.log(error);
//           array.splice(index, 1);
//           console.log(clients.map((client) => client.id));
//         }
//       }
//     });
//   }, 10000);
//   // ws.send(JSON.stringify({ string: "" }));
// });

httpserver.listen(port);

app.get("/", function (req, res, next) {
  try {
    res.sendFile(path.join(__dirname, "..", "static", "html", "index.html"));
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Something went wrong" });
  }
});

app.get("/gps", function (req, res) {
  // const ipAdress = req.socket.remoteAddress;
  console.log('req.query', req.query)
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);

  // const latitude = Number(latitudeStr);
  // const longitude = Number(longitudeStr);
  const clientId = req.query.clientId as string;
  const now = new Date();
  if(check5Min(gpsObj[clientId][0].timestamp, now)){
    res.json({end: true})
  }

  // console.log(clientId)
  // console.log(`ipAdress: ${ipAdress}`);
  console.log(Object.keys(gpsObj))
  if (Object.keys(gpsObj).includes(clientId)) {
    if(gpsObj[clientId][0].nearbyId) {
      gpsObj[clientId].push({
        timestamp: now,
        latitude: latitude,
        longitude: longitude,
        nearbyId: gpsObj[clientId][0].nearbyId
      });
    } else {
      gpsObj[clientId].push({
        timestamp: now,
        latitude: latitude,
        longitude: longitude,
      });
    }
  } else {
    const nearbyId = nearbyGps(latitude, longitude)

    gpsObj[clientId] = nearbyId ? [
      {
        timestamp: now,
        latitude: latitude,
        longitude: longitude,
        nearbyId: nearbyId
      },
    ] : [
      {
        timestamp: now,
        latitude: latitude,
        longitude: longitude,
      },
    ];
  // }
  }
  
  if(Object.keys(gpsObj).length > 0 && gpsObj[clientId][0].nearbyId !== undefined) {
    const nearbyObj = gpsObj[gpsObj[clientId][0].nearbyId][0]
    const freq = setFreq(nearbyObj.latitude, nearbyObj.longitude, originGps.latitude, originGps.longitude)
    // const freq = 440 + (nearbyObj.latitude - originGps.latitude) + (nearbyObj.longitude + originGps.longitude)
    res.json({frequency: freq})
  } else {
    res.json({ frequency: 440 });
  }

});

app.get("/origingps", function (req, res) {
  res.json(originGps);
});

app.get("/writeout", function(req, res) {
  const logResult = writeOutLog(gpsObj);
  console.log(logResult)
  res.json({ success: logResult });
});

app.get("/read", async function (req, res) {
  // const filename = req.query.filename
  const filePath = path.join(
    __dirname,
    "..",
    "log",
    req.query.filename + ".json"
  );
  const string = await fs.readFileSync(filePath, {encoding: 'utf-8'});
  const json = JSON.parse(string) as GpsObject
  Object.keys(json).forEach((element) =>  {
    if(!Object.keys(gpsObj).includes(element)) {
      gpsObj[element] = json[element]
      console.log('read:', element)
    }
  })
})

export const nearbyGps = (latitude: number, longitude: number): string => {
  const distance = Math.abs(originGps.latitude - latitude) + Math.abs(originGps.longitude - longitude)
  let candidateDiff = 540;
  let candidateId: string | null = null;
  for(let id in gpsObj) {
    const candidateGps = gpsObj[id][0]
    const diff = Math.abs(distance - Math.abs(originGps.latitude - candidateGps.latitude) + Math.abs(originGps.longitude - candidateGps.longitude))
    if(diff < candidateDiff) {
      candidateDiff = diff;
      candidateId = id;
    }
  }
  return candidateId
}

const check5Min = (start: Date, target: Date) => {
      // ミリ秒単位での差分を計算
      const differenceInMs = Math.abs(target.getTime() - start.getTime());
      // ミリ秒を分に変換
      const differenceInMinutes = differenceInMs / (1000 * 60);
      // 差分が5分以上かをチェック
      return differenceInMinutes >= 5;
}