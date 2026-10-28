# Redis cho danh mục công khai và tải lần đầu

## Phạm vi

| API                                                                | TTL Redis |
| ------------------------------------------------------------------ | --------- |
| `GET /api/podcasts/catalog`                                        | 5 phút    |
| `GET /api/categories`, `/api/categories/popular`                   | 15 phút   |
| `GET /api/lessons`, gồm `featured=true` và các `categoryId` hợp lệ | 15 phút   |

Các API trên chỉ lưu kết quả danh mục công khai. Thông tin đăng nhập, quyền nghe theo tài khoản, giới hạn Premium, lịch sử, từ vựng đã lưu và danh mục admin không dùng cache Redis này. Kiểm tra video ẩn và quyền phát vẫn đọc nguồn hiện tại trên máy chủ.

Kết quả có TTL và namespace riêng cho từng môi trường. Giá trị JSON lớn được nén; không lưu audio/video trong Redis. Một kết nối Redis được dùng chung trong mỗi tiến trình ứng dụng.

## Chạy local

```powershell
npm.cmd run cache:up
```

Lệnh này chạy container `hihienglish-public-cache`, Redis 7.4, chỉ mở trên `127.0.0.1:6380`. Giới hạn dữ liệu là 64 MB với chính sách `allkeys-lru`; container có giới hạn bộ nhớ 128 MB và healthcheck PING. Không bật persistence vì đây là dữ liệu có thể tạo lại.

Thêm vào `.env` phía backend, sau đó khởi động lại backend:

```dotenv
REDIS_URL=redis://127.0.0.1:6380
REDIS_CACHE_PREFIX=hihienglish:development:public:v1
REDIS_COMMAND_TIMEOUT_MS=150
```

`npm.cmd run cache:down` dừng dịch vụ Redis riêng của ứng dụng. Không cần xóa dữ liệu database. Bỏ `REDIS_URL` và khởi động lại backend để tắt cache; ứng dụng tiếp tục đọc nguồn dữ liệu.

## Production

1. Dùng Redis trong mạng riêng hoặc dịch vụ managed Redis gần backend. Cấu hình TLS/credentials theo nhà cung cấp; URL có TLS bắt đầu bằng `rediss://`.
2. Đặt `REDIS_URL` trong biến môi trường của **backend** và dùng prefix riêng, ví dụ `hihienglish:production:public:v1`. Không dùng biến `VITE_*` cho URL hoặc mật khẩu Redis. Các instance cùng môi trường phải dùng cùng prefix.
3. Cài dependencies, build và triển khai ứng dụng như hiện tại. Khởi động lại các instance để nhận biến môi trường mới.
4. Xác nhận kết nối, TTL và thời gian phản hồi. Có thể kiểm tra `PublicCatalogCacheService.diagnostics()` từ mã vận hành nội bộ; không có endpoint công khai mới trả thông tin kết nối.

Không mở Redis trực tiếp ra Internet. Cấu hình Docker local chỉ dành cho máy phát triển, không phải cấu hình public cho production. Thay đổi schema không cần thiết cho tính năng này. Chưa triển khai lên website production trong tác vụ này.

## Nạp trước, cập nhật và lỗi kết nối

- Nạp danh mục nền sau khi ứng dụng khởi động và khi Redis kết nối lại; không chờ Redis để mở HTTP server. Các danh mục đã đăng ký được làm mới khi nạp nền để tránh giữ dữ liệu của bản chạy trước.
- Sau khi thêm kênh, ẩn/hiện kênh hoặc video, thay đổi trạng thái phụ đề, hay xác nhận nhập video trong admin, máy chủ xóa đúng key danh mục Podcast và nạp lại sau một khoảng debounce ngắn.
- Các request cùng key trong một instance dùng chung tác vụ đang chạy. Các instance phối hợp bằng fill token có thời hạn. Khi dữ liệu bị xóa, token cũng bị xóa; một lượt đọc nguồn cũ không thể ghi đè kết quả mới vào cache.
- Redis chưa cấu hình, mất kết nối hoặc trả lỗi: đọc nguồn dữ liệu như trước. Lệnh Redis có deadline mặc định 150 ms và không xếp hàng khi offline; client tự kết nối lại. Không cache lỗi nguồn.
- Cập nhật database ngoài ứng dụng có thể chờ đến hết TTL mới hiện trong danh mục. Các thao tác admin qua ứng dụng có invalidation. Nếu Redis không nhận được invalidation do sự cố mạng, TTL là giới hạn dự phòng cho dữ liệu danh mục cũ; kiểm tra quyền phát và video ẩn vẫn độc lập với danh mục này.
- Không dùng `KEYS`, `FLUSHDB` hoặc `FLUSHALL` để bảo trì cache. Khi cần đổi định dạng dữ liệu, đổi phiên bản trong prefix; key cũ tự hết TTL.

## Tối ưu trình duyệt

- Chỉ tải mã trang chủ trong gói ban đầu; các trang còn lại tải qua `React.lazy` khi cần.
- Trang chủ dùng danh sách tóm tắt 10 bài nổi bật, thay vì kéo toàn bộ kho bài học/phụ đề vào gói ban đầu. File tóm tắt được tạo lại từ `lessons.json` khi chạy `build:client` hoặc `dev:client`.
- API cần cho trang đang mở được ưu tiên; các lượt đọc nền khác chạy khi trình duyệt rảnh sau đó. Có deadline để một API chậm không chặn toàn bộ tải nền. Khi đổi route/tài khoản, tác vụ chưa khởi chạy được hủy.
- Backend nén HTTP với payload phù hợp; đường dẫn media không bị áp dụng nén này.

Redis giảm chi phí đọc API khi có cache. Thời gian khởi động một máy chủ đang ngủ, tải iframe YouTube và tốc độ mạng người dùng vẫn cần được đo riêng; không thể suy từ số đo cache thành thời gian tải toàn trang.

## Kiểm chứng ngày 27/10/2026

Số đo trên Windows local, database hiện tại và Redis Docker. Bản trước chạy ở cổng 3004; bản build mới được kiểm thử độc lập ở cổng 3101.

| Chỉ số                           |           Trước |                           Sau |
| -------------------------------- | --------------: | ----------------------------: |
| Trung vị TTFB danh mục Podcast   | 517 ms (5 lượt) | 3,8 ms (7 lượt, cache đã nạp) |
| Dữ liệu danh mục truyền qua HTTP |     44.809 byte |              9.726 byte, gzip |
| Gói JavaScript entry             |  1.535.443 byte |       307.313 byte (giảm 80%) |
| Gói entry sau gzip               |    410.877 byte |        96.219 byte (giảm 77%) |

JSON danh mục trước/sau giống nhau hoàn toàn. Categories và lessons nổi bật lần lượt có trung vị TTFB 2,3 ms và 3,7 ms khi cache đã nạp.

- 105 kiểm thử backend liên quan đến cache, Podcast, Premium, phụ đề và từ vựng đạt, gồm chỉ invalidation sau khi giao dịch nhập video đã commit và giữ cache khi giao dịch rollback.
- 16 kiểm thử Podcast, 39 kiểm thử Premium player/admin và 21 kiểm thử prefetch phía client đạt.
- Kiểm thử Redis thật: 30 request trên hai instance chỉ tải nguồn một lần; invalidation giữa hai instance, hết TTL và khôi phục payload lỗi đều đạt. Test dùng prefix UUID riêng và chỉ xóa các key của chính nó.
- Tắt container Redis thử nghiệm: ba API vẫn trả HTTP 200, nội dung giữ nguyên. Bật lại: ứng dụng tự kết nối, nạp cache và phục hồi TTL.
- Browser: trang chủ, Podcast, Khám phá và trạng thái khách ở Từ vựng hiển thị đúng; không có lỗi JavaScript được ghi nhận trong các lượt kiểm tra. Ảnh: `design-qa-evidence/redis-first-load.png`.
- API quyền phát của khách với `H5qcIEH1iVs` vẫn trả `canListenFull=false`, `previewLimitSeconds=20` và `Cache-Control: private, no-store`.
- Backend TypeScript, TypeScript phạm vi prefetch và build client thành công. Client vẫn có các cảnh báo chunk lớn ở những trang tải sau. Full client TypeScript còn năm lỗi có sẵn ở Explore, History, Profile và SpeakingHistory, nằm ngoài thay đổi này.

Báo cáo máy đọc được: `output/redis-performance-summary.json`. Để chạy lại:

```powershell
npx.cmd tsc -p tsconfig.build.json --incremental false
node node_modules/jest/bin/jest.js --runInBand --testPathPatterns 'public-catalog|podcast|featured-video|saved-vocabulary'
npm.cmd run test:public-cache:redis
npm.cmd run test:prefetch
npm.cmd run test:podcast
npm.cmd run test:podcast-premium
npm.cmd run build:client
```

Tham khảo cách kết nối chính thức: [node-redis](https://redis.io/docs/latest/develop/clients/nodejs/connect/), [fill token và giải phóng khóa theo chủ sở hữu](https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/).
