# 🚀 Kullanım Kılavuzu

## API Server'ı Başlatma

### Windows PowerShell:
```powershell
cd hybrid-persistence\visualization
.\start-api.bat
```

### Veya Manuel:
```powershell
cd hybrid-persistence\visualization
npm install
npm start
```

## Dashboard'a Erişim

API server başladıktan sonra tarayıcıda şu adreslerden birini açın:

1. **http://localhost:3000/** (Ana sayfa)
2. **http://localhost:3000/dashboard.html** (Doğrudan dashboard)

## API Endpoints

- `GET http://localhost:3000/api/redis-info` - Persistence bilgileri
- `GET http://localhost:3000/api/redis-stats` - Redis istatistikleri
- `POST http://localhost:3000/api/trigger-rewrite` - AOF rewrite tetikle
- `GET http://localhost:3000/api/health` - Health check

## Sorun Giderme

### 404 Hatası
- API server'ın çalıştığını kontrol edin
- `http://localhost:3000/api/health` adresini tarayıcıda açın
- Eğer çalışıyorsa `{"status":"ok"}` görmelisiniz

### CSP (Content Security Policy) Uyarıları
- Bu uyarılar tarayıcı uzantılarından kaynaklanır (Razor Wallet, Chrome DevTools)
- Dashboard'un çalışmasını etkilemez
- Güvenlik açısından sorun değildir

### Container Bulunamadı
- Redis container'ının çalıştığını kontrol edin:
  ```powershell
  docker ps | findstr redis-hybrid
  ```
- Eğer çalışmıyorsa:
  ```powershell
  cd hybrid-persistence
  docker-compose up -d redis-hybrid
  ```

## Notlar

- API server çalışırken terminal penceresini kapatmayın
- Dashboard otomatik olarak 5 saniyede bir yenilenir
- API server çalışmıyorsa dashboard hata mesajı gösterir

