import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const Client: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [originLatitude, setOriginLatitude] = useState<number | null>(null);
  const [originLongitude, setOriginLongitude] = useState<number | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillator1, setOscillator1] = useState<OscillatorNode | null>(null);
  const [oscillator2, setOscillator2] = useState<OscillatorNode | null>(null);
  const [text, setText] = useState<string>("画面にタップしてください");

  const clientId = uuidv4();

  // 原点の取得
  useEffect(() => {
    const getOrigin = async () => {
      try {
        const response = await fetch(
          `https://${import.meta.env.VITE_BACKEND_URL}/origingps`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const json = await response.json();
        console.log(json);
        setOriginLatitude(json.latitude);
        setOriginLongitude(json.longitude);
      } catch (error) {
        console.error("Error fetching ", error);
      }
    };
    getOrigin();
  });

  const initTap = () => {
    if (initialized || originLatitude === null || originLongitude === null) {
      setText("もう一度タップしてください");
      return;
    }

    setInitialized(true);
    const context = new AudioContext();
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    const gainNode = context.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    // osc.frequency.setValueAtTime(latitude, context.currentTime); // 緯度を周波数に設定
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(context.destination);
    osc1.start();
    osc2.start();

    setAudioContext(context);
    setOscillator1(osc1);
    setOscillator2(osc2);
    setText("緯度経度を取得して音を鳴らします");

    const intervalId = setInterval(() => {
      // 地理情報を取得して発音
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          setLatitude(lat);
          const lon = position.coords.longitude;
          setLongitude(lon);
          console.log(`Latitude: ${lat}, Longitude: ${lon}`);
          const freq = 440 + (lat - originLatitude) + (lon - originLongitude);
          console.log(`Frequency: ${freq}`);
          osc1.frequency.setTargetAtTime(freq, context.currentTime, 2);

          setText(`緯度: ${lat}, 経度: ${lon}, 音程: ${freq}Hz`);
        },
        (error) => {
          console.error("Error fetching geolocation", error);
        }
      );
      // 3秒毎にlocalhost:8080にGETリクエストを送信して音を鳴らす
      fetch(
        `https://${import.meta.env.VITE_BACKEND_URL}/gps?latitude=${String(
          latitude
        )}&longitude=${String(longitude)}&clientId=${clientId}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then((json) => {
          console.log(json);
          osc2.frequency.setTargetAtTime(json.freqency, context.currentTime, 2);
        })
        .catch((error) => {
          console.error("Error fetching audio", error);
        });
    }, 3000);

    // 5分後に停止する
    setTimeout(() => {
      clearInterval(intervalId);
      if (oscillator1) {
        oscillator1.stop();
        oscillator1.disconnect();
      }
      if (oscillator2) {
        oscillator2.stop();
        oscillator2.disconnect();
      }
      if (audioContext) {
        audioContext.close();
      }
      setText("終わりです");
    }, 30000);
  };

  return (
    <div
      className="flex justify-center items-center h-screen"
      onClick={initTap}
    >
      {text}
    </div>
  );
};

export default Client;
