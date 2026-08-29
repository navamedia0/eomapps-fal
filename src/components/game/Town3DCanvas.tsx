import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { GOLD, NIGHT_DEEP } from '@/theme/colors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RNWebView = WebView as any;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const GLB_ASSET = require('../../../assets/kasaba/town_model.glb');

type Props = {
  onBuildingSelected: (buildingKey: string | null) => void;
};

const THREE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; -webkit-user-select: none; }
    body, html {
      width: 100%; height: 100%; overflow: hidden;
      background: radial-gradient(circle at center, #1B0E3C 0%, #090518 100%);
    }
    #canvas-container { width: 100%; height: 100%; touch-action: none; }
    #hint {
      position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%);
      color: #FDE68A; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px; font-weight: 700; background: rgba(20, 13, 54, 0.92);
      padding: 6px 18px; border-radius: 20px; border: 1px solid #7C3AED;
      box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); pointer-events: none;
      white-space: nowrap; z-index: 50; letter-spacing: 0.3px;
    }
    #loader {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      color: #FDE68A; font-family: sans-serif; font-size: 14px; font-weight: bold;
      text-align: center; z-index: 40; pointer-events: none;
    }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
</head>
<body>
  <div id="hint">👆 1 Parmak: Haritada Gezin • 🏰 Binalara Dokun</div>
  <div id="loader">✨ Mistik 3D Kasaba Yükleniyor...</div>
  <div id="canvas-container"></div>

  <script>
    const container = document.getElementById('canvas-container');
    const loaderEl = document.getElementById('loader');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0C061F);
    scene.fog = new THREE.FogExp2(0x0C061F, 0.011);

    const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 1000);
    const START_POS = new THREE.Vector3(0, 75, 80);
    const TARGET_POS = new THREE.Vector3(0, 22, 26);
    camera.position.copy(START_POS);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // --- GOOGLE HARİTALAR / GALERİ KONTROLLERİ ---
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_ROTATE
    };
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2.12;
    controls.minPolarAngle = Math.PI / 6.5;
    controls.minDistance = 8;
    controls.maxDistance = 55;
    controls.target.set(0, 1.2, 0);

    // --- MİSTİK TİLKİ PALETİ ZEMİN ---
    const groundGeo = new THREE.PlaneGeometry(350, 350, 24, 24);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x140B2E,
      roughness: 0.88,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.15;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- ŞEHRİN DİBİNDEKİ YAKIN DAĞLAR ---
    const closeCliffMat = new THREE.MeshStandardMaterial({
      color: 0x24124D,
      roughness: 0.8,
      metalness: 0.2,
      emissive: new THREE.Color(0x13072E),
      emissiveIntensity: 0.4
    });
    const cliffCapMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.7,
      emissive: new THREE.Color(0x064E3B),
      emissiveIntensity: 0.3
    });

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const radius = 19.5 + Math.sin(i * 3.5) * 3.2;
      const height = 9 + Math.cos(i * 2.2) * 4.5;
      
      const cliffGeo = new THREE.CylinderGeometry(2.4, 3.8, height, 6);
      const cliff = new THREE.Mesh(cliffGeo, closeCliffMat);
      cliff.position.set(Math.cos(angle) * radius, height / 2 - 0.2, Math.sin(angle) * radius);
      cliff.castShadow = true;
      cliff.receiveShadow = true;
      scene.add(cliff);

      const capGeo = new THREE.ConeGeometry(2.6, 2.5, 6);
      const cap = new THREE.Mesh(capGeo, cliffCapMat);
      cap.position.set(Math.cos(angle) * radius, height + 0.8, Math.sin(angle) * radius);
      cap.castShadow = true;
      scene.add(cap);
    }

    // --- IŞIKLANDIRMA ---
    const ambientLight = new THREE.AmbientLight(0x6D28D9, 1.35);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFDE68A, 1.85);
    sunLight.position.set(20, 42, 22);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    const cyanLight = new THREE.PointLight(0x38BDF8, 3.2, 45);
    cyanLight.position.set(-10, 7, -10);
    scene.add(cyanLight);

    const goldLight = new THREE.PointLight(0xF59E0B, 2.8, 40);
    goldLight.position.set(0, 8, 0);
    scene.add(goldLight);

    const emeraldPointLight = new THREE.PointLight(0x10B981, 2.2, 35);
    emeraldPointLight.position.set(10, 6, 8);
    scene.add(emeraldPointLight);

    // Yıldız Tozları
    const starGeo = new THREE.BufferGeometry();
    const starCount = 320;
    const starPos = new Float32Array(starCount * 3);
    for(let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 80;
      starPos[i+1] = Math.random() * 35 + 2;
      starPos[i+2] = (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xFDE68A, size: 0.8, transparent: true, opacity: 0.85 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- MİSTİK TİLKİ RENK DOKUSU DÖNÜŞTÜRÜCÜ ---
    function createMysticFoxTexture(origImg) {
      const canvas = document.createElement('canvas');
      canvas.width = origImg.width || 512;
      canvas.height = origImg.height || 512;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(origImg, 0, 0);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];

        // 1. Zemin petek yanları (Sarı/Turuncu) -> Derin Ametist Gece Moru
        if (r > 150 && g > 110 && b < 100) {
          d[i] = Math.min(255, 45 + r * 0.18);
          d[i+1] = Math.min(255, 18 + g * 0.10);
          d[i+2] = Math.min(255, 95 + r * 0.42);
        }
        // 2. Çimler & Ağaçlar -> Büyülü Orman Zümrüt Yeşili
        else if (g > r && g > b && g > 80) {
          d[i] = Math.min(255, 8 + g * 0.08);
          d[i+1] = Math.min(255, 90 + g * 0.45);
          d[i+2] = Math.min(255, 60 + g * 0.35);
        }
        // 3. Su ve mavi çatılar -> Göksel Safir & Turkuaz
        else if (b > r && b > 100) {
          d[i] = Math.min(255, 40 + b * 0.2);
          d[i+1] = Math.min(255, 140 + b * 0.45);
          d[i+2] = Math.min(255, 220 + b * 0.2);
        }
        // 4. Beyaz Duvarlar -> Ay Işığı Fildişi
        else if (r > 180 && g > 180 && b > 180) {
          d[i] = 245;
          d[i+1] = 230;
          d[i+2] = 200;
        }
      }
      ctx.putImageData(imgData, 0, 0);

      const tex = new THREE.CanvasTexture(canvas);
      tex.encoding = THREE.sRGBEncoding;
      tex.flipY = false;
      tex.needsUpdate = true;
      return tex;
    }

    let windmillFan = null;
    let townModelGroup = null;
    let isFlyInFinished = false;
    let flyInProgress = 0;

    // --- HİYERARŞİDEN BİNA KİMLİĞİNİ TESPİT ETME ---
    function identifyBuildingKeyFromHierarchy(obj) {
      let curr = obj;
      while (curr && curr !== scene && curr.name !== 'Scene') {
        const s = (curr.name || '').toLowerCase();
        
        // 1. Klan Kalesi (th_110, castle)
        if (s.includes('th_') || s.includes('th110') || (s.includes('castle') && !s.includes('tower'))) {
          return 'birlik-kulubu';
        }
        // 2. Kahraman Kulübü (GoldTower)
        if (s.includes('goldtower') || s.includes('gold_tower')) {
          return 'karakter-kulubu';
        }
        // 3. Mistik Çiftlik (farmHouse, fan_48)
        if (s.includes('farm') || s.includes('fan')) {
          return 'ciftlik';
        }
        // 4. Keşif Rıhtımı / Su Değirmeni (WaterHouse, Cylinder_167, BerrHouse)
        if (s.includes('water') || s.includes('berr') || s.includes('cylinder')) {
          return 'kesif-rihtimi';
        }
        // 5. Mistik Arena & Savunma Kuleleri (Tower2, Tower, Crossbow, Cannon)
        if (s.includes('tower') || s.includes('cross') || s.includes('cannon')) {
          return 'oyun-salonu';
        }
        // 6. Kart Tapınağı / Dükkanı (house 01)
        if (s.includes('house 01') || s.includes('house_01') || s.includes('house.00') || (s.includes('house') && !s.includes('water') && !s.includes('farm') && !s.includes('berr'))) {
          return 'kart-dukkani';
        }

        curr = curr.parent;
      }
      return null;
    }

    // --- GLB MODELİNİ YÜKLE ---
    window.loadModelFromBase64 = function(base64String) {
      try {
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const arrayBuffer = byteArray.buffer;

        const loader = new THREE.GLTFLoader();
        loader.parse(arrayBuffer, '', function(gltf) {
          townModelGroup = gltf.scene;
          townModelGroup.position.set(0, 0, 0);
          townModelGroup.scale.set(1.25, 1.25, 1.25);

          let customFoxTexture = null;

          townModelGroup.traverse(function(child) {
            if (child.isMesh) {
              const name = (child.name || '').toLowerCase();
              const matName = (child.material && child.material.name ? child.material.name : '').toLowerCase();

              // 1. Siyah-Beyaz Petek Izgarayı Gizle
              if (matName.includes('hex') || name.includes('object_4') || name.includes('plane_1')) {
                child.visible = false;
                return;
              }

              // 2. Uzaktaki 3 kopuk turuncu sütunu gizle
              const worldPos = new THREE.Vector3();
              child.getWorldPosition(worldPos);
              if (Math.hypot(worldPos.x, worldPos.z) > 34) {
                child.visible = false;
                return;
              }

              child.castShadow = true;
              child.receiveShadow = true;

              if (child.material) {
                if (child.material.map && child.material.map.image) {
                  if (!customFoxTexture) {
                    customFoxTexture = createMysticFoxTexture(child.material.map.image);
                  }
                  child.material.map = customFoxTexture;
                  child.material.needsUpdate = true;
                }

                child.material.roughness = 0.52;
                child.material.metalness = 0.18;

                const lowerName = (name + ' ' + (child.parent ? child.parent.name : '')).toLowerCase();
                if (lowerName.includes('th_') || lowerName.includes('gold')) {
                  child.material.emissive = new THREE.Color(0xD97706);
                  child.material.emissiveIntensity = 0.38;
                } else if (lowerName.includes('tower') || lowerName.includes('water')) {
                  child.material.emissive = new THREE.Color(0x38BDF8);
                  child.material.emissiveIntensity = 0.30;
                } else if (lowerName.includes('tree') || lowerName.includes('pine')) {
                  child.material.emissive = new THREE.Color(0x064E3B);
                  child.material.emissiveIntensity = 0.22;
                } else if (lowerName.includes('fan')) {
                  windmillFan = child;
                }
              }
            }
          });

          scene.add(townModelGroup);
          if (loaderEl) loaderEl.style.display = 'none';

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOADED' }));
          }
        }, function(err) {
          if (loaderEl) loaderEl.innerText = 'Yükleme hatası: ' + err;
        });
      } catch(e) {
        if (loaderEl) loaderEl.innerText = 'İşleme hatası: ' + e.message;
      }
    };

    // --- BİNA TIKLAMA VE VURGU SİSTEMİ ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };

    window.addEventListener('pointerdown', (e) => {
      touchStartTime = Date.now();
      touchStartPos = { x: e.clientX, y: e.clientY };
      if (!isFlyInFinished) {
        isFlyInFinished = true;
        camera.position.copy(TARGET_POS);
      }
    });

    window.addEventListener('pointerup', (e) => {
      const dist = Math.hypot(e.clientX - touchStartPos.x, e.clientY - touchStartPos.y);
      // Harita kaydırması yapıldıysa tıklama sayma
      if (Date.now() - touchStartTime > 300 || dist > 10) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      if (!townModelGroup) return;

      const intersects = raycaster.intersectObjects(townModelGroup.children, true);

      if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
          const hit = intersects[i].object;
          if (!hit.visible) continue;

          // Hiyerarşiden gerçek binayı bul
          const bKey = identifyBuildingKeyFromHierarchy(hit);

          if (bKey) {
            // Tıklanan binada altın aura parlaması
            if (hit.material && hit.material.emissive) {
              const prevColor = hit.material.emissive.clone();
              const prevInt = hit.material.emissiveIntensity;
              hit.material.emissive.setHex(0xFDE68A);
              hit.material.emissiveIntensity = 1.5;
              setTimeout(() => {
                hit.material.emissive.copy(prevColor);
                hit.material.emissiveIntensity = prevInt;
              }, 350);
            }

            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_BUILDING', key: bKey }));
            }
            return;
          }
        }
      }

      // Boş zemin veya ağaca tıklandıysa menüyü kapat
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DESELECT' }));
      }
    });

    function animate() {
      requestAnimationFrame(animate);

      if (!isFlyInFinished) {
        flyInProgress += 0.022;
        const t = Math.min(1, 1 - Math.pow(1 - flyInProgress, 3));
        camera.position.lerpVectors(START_POS, TARGET_POS, t);
        if (flyInProgress >= 1) {
          isFlyInFinished = true;
          camera.position.copy(TARGET_POS);
        }
      }

      controls.update();
      if (windmillFan) windmillFan.rotation.z += 0.038;
      starField.rotation.y += 0.0005;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    setTimeout(() => {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'READY' }));
      }
    }, 200);
  </script>
</body>
</html>
`;

export default function Town3DCanvas({ onBuildingSelected }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [webviewReady, setWebviewReady] = useState(false);
  const [base64Model, setBase64Model] = useState<string | null>(null);
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      try {
        const asset = await Asset.fromModule(GLB_ASSET).downloadAsync();
        const uri = asset.localUri || asset.uri;
        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!isCancelled) {
          setBase64Model(b64);
        }
      } catch (err) {
        console.warn('GLB 3D model okuma hatası:', err);
      }
    })();
    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    if (webviewReady && base64Model && webviewRef.current) {
      webviewRef.current.injectJavaScript(`
        if (typeof window.loadModelFromBase64 === 'function') {
          window.loadModelFromBase64("${base64Model}");
        }
        true;
      `);
    }
  }, [webviewReady, base64Model]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        setWebviewReady(true);
      } else if (data.type === 'LOADED') {
        setLoaded(true);
      } else if (data.type === 'SELECT_BUILDING' && data.key) {
        onBuildingSelected(data.key);
      } else if (data.type === 'DESELECT') {
        onBuildingSelected(null);
      }
    } catch (e) {
      console.warn('WebView mesaj hatası:', e);
    }
  }, [onBuildingSelected]);

  return (
    <View style={styles.container}>
      <RNWebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: THREE_HTML }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowUniversalAccessFromFileURLs
        onMessage={handleMessage}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />

      {!loaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GOLD} />
          <Text style={styles.loadingText}>🦊 Mistik 3D Kasaban Yaratılıyor…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: NIGHT_DEEP,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090518',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 0.4,
  },
});
