# Etkinlik Yönetim Uygulaması (Event Management App)

Bu proje, Node.js ve Express kullanılarak geliştirilmiş bir etkinlik yönetimi web uygulamasıdır. Kullanıcıların kaydolup giriş yapabildiği, etkinlikleri görüntüleyebildiği bir platformdur.

## ⚠️ Proje Durumu: Geliştirme Aşamasında

Bu proje şu anda aktif olarak geliştirilmektedir. Henüz tamamlanmamıştır ve üretim ortamında kullanıma uygun değildir. Yeni özellikler eklenmekte ve mevcut kod tabanı iyileştirilmektedir.

## Mevcut Özellikler

- **Kullanıcı Kimlik Doğrulama:** Güvenli kullanıcı kaydı, girişi ve çıkış işlemleri.
- **Oturum Yönetimi:** `express-session` ve `connect-session-sequelize` ile kalıcı oturum yönetimi.
- **Rol Tabanlı Erişim Kontrolü:** `admin` ve `user` olmak üzere iki farklı kullanıcı rolü.
- **Güvenlik:** `csurf` ile CSRF (Siteler Arası İstek Sahtekarlığı) koruması.
- **Şifre Güvenliği:** `bcrypt.js` kullanılarak kullanıcı şifrelerinin güvenli bir şekilde hash'lenmesi.

## Kullanılan Teknolojiler

- **Backend:** Node.js, Express.js
- **Veritabanı:** SQLite (Sequelize ORM ile)
- **View Motoru:** EJS
- **Kimlik Doğrulama ve Oturum:** `bcrypt.js`, `express-session`
- **Güvenlik:** `csurf`

## Kurulum ve Başlatma

Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler

- Node.js ve npm

### Adımlar

1.  **Projeyi klonlayın:**

    ```bash
    git clone <repository-url>
    cd EventManagementApp
    ```

2.  **Gerekli paketleri yükleyin:**

    ```bash
    npm install
    ```

3.  **`.env` dosyasını oluşturun:**
    Projenin ana dizininde `.env` adında bir dosya oluşturun ve içine oturum (session) için gizli bir anahtar ekleyin:

    ```
    SESSION_SECRET=buraya_guvenli_ve_rastgele_bir_dizi_yazin
    ```

4.  **Uygulamayı başlatın:**
    ```bash
    node server.js
    ```
    Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır.
