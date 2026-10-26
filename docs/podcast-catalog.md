# Quản lý kênh và video Podcast

Admin → Nội dung → Podcast có hai mục: **Kênh YouTube** và **Khóa Premium**.
Danh sách công khai lấy từ database qua `/api/podcasts/catalog`; thêm nội dung
không cần sửa JSON hay build/deploy lại frontend.

## Sử dụng

- **Thêm kênh YouTube**: nhập URL `https://www.youtube.com/@handle`, URL
  `/channel/UC…`, `@handle` hoặc mã kênh. Kênh trùng được báo lỗi.
- **Quản lý video → Lấy thêm video cũ**: nhập số video muốn bổ sung (1–100).
  Ví dụ có 20 video, nhập 30 để tìm tối đa 30 video chưa có phía sau mốc
  video đã nhập. Video mới hơn mốc đó được lấy bằng thao tác riêng bên dưới.
- **Cập nhật video mới**: tìm các video mới trước mốc video đã nhập đầu tiên.
- **Thêm bằng URL**: chọn một video công khai thuộc đúng kênh.
- Mỗi phiên trả về **danh sách xem trước**. Chọn video và bấm
  **Thêm và hiển thị** mới thêm vào thư viện. Kết quả có thể ít hơn số yêu cầu
  nếu không còn đủ video phù hợp. Bỏ qua video trùng, riêng tư, đang live hoặc
  không cho phát nhúng. Shorts hợp lệ được xử lý như video thông thường.
- Có thể đóng hộp thoại hoặc tải lại trang: mở **Các phiên nhập gần đây**
  để xem tiếp. Phiên thất bại có nút thử lại. Phiên đã nhập không nhập lần hai.
- Ẩn/hiện kênh hoặc video không xóa lịch sử, từ vựng hay cài đặt Premium.
  Video đang ẩn không được cấp quyền nghe qua API Podcast công khai.
- Khóa Premium tiếp tục quản lý riêng cho từng video, kể cả video vừa nhập.
  Video mới mặc định miễn phí. Phụ đề được xử lý riêng khi mở bài học;
  nhập metadata không tạo đồng loạt phụ đề hoặc tiêu thụ hạn mức nhập cá nhân.

## Kết nối YouTube

1. Tạo/chọn project tại Google Cloud Console.
2. Bật **YouTube Data API v3** trong APIs & Services → Library.
3. Credentials → Create credentials → API key. Giới hạn API cho YouTube Data API v3.
4. Đặt `YOUTUBE_DATA_API_KEY` trong `.env` hoặc Variables của backend Railway,
   rồi khởi động lại backend. Không dùng biến `VITE_…` cho khóa phía server.

Nếu chưa có khóa, admin vẫn quản lý được thư viện/Premium hiện có và hiển thị
hướng dẫn cấu hình; các thao tác lấy dữ liệu YouTube được vô hiệu hóa.
Khóa chỉ được gửi từ backend đến endpoint cố định của Google.

Tài liệu API: [credentials](https://developers.google.com/youtube/registering_an_application),
[channels.list](https://developers.google.com/youtube/data/reference/rest/v3/channels/list),
[playlistItems.list](https://developers.google.com/youtube/data/reference/rest/v3/playlistItems/list),
[videos.list](https://developers.google.com/youtube/data/reference/rest/v3/videos/list).

## Schema, dữ liệu cũ và tác vụ nền

- Schema thêm `podcast_channels`, `podcast_videos`, `podcast_import_jobs`.
  Migration chỉ thêm bảng/index: `prisma/updates/20261026_podcast_catalog.sql`.
- Với môi trường đã tắt `AUTO_SYNC_DB`, chạy `npm run build` rồi
  `npm run db:podcast-catalog` trước khi khởi động backend mới. Script kiểm tra
  cài đặt Premium trước/sau migration. Không chạy reset database.
- Backend khởi động sẽ backfill 8 kênh/145 video cũ bằng insert bỏ qua trùng.
  Giữ nguyên id video và đường dẫn cũ, không ghi đè dữ liệu đã chỉnh trong admin.
  Cài đặt Premium nằm ở bảng riêng và không bị thay đổi.
- Worker kiểm tra hàng đợi mỗi 2 giây, lưu tiến độ và kết quả vào PostgreSQL.
  Claim có lease 180 giây; sau crash, tiến trình khác có thể nhận lại lease hết hạn.
  Mỗi phiên quét tối đa 5.000 video/120 giây, request Google timeout 20 giây.
  Phiên quá giới hạn báo lỗi và chưa thêm bất kỳ video nào.
- Khóa giao dịch theo kênh chống gửi trùng phiên và nhập đồng thời. Commit chỉ nhận
  id trong kết quả do máy chủ lấy, không nhận tiêu đề/thời lượng do client gửi.
- Public catalog được prefetch, cache 30 giây và kiểm tra lại trên focus/visibility.
  Thao tác admin vô hiệu cache trong tab hiện tại; các tab khác cập nhật khi
  cache hết hạn. Premium entitlement vẫn kiểm tra riêng phía máy chủ.
- Rollback ứng dụng giữ các bảng mới và dữ liệu đã nhập; không drop bảng có dữ liệu.

## Kiểm thử

- `npm run test:podcast-premium`: admin nhập/chọn video, phục hồi phiên và Premium.
- `npm run test:podcast`: điều hướng và catalog API động.
- `npm run test:prefetch`: tải nền, cache và phân tách dữ liệu người dùng.
- `node node_modules/jest/bin/jest.js --runInBand --testPathPatterns 'podcast-access|podcast-catalog.controller|youtube-catalog.service|featured-video.service|saved-vocabulary.service'`
- `npm run test:podcast-catalog:db` sau backend build: kiểm thử thật PostgreSQL
  trong schema tạm riêng, tự dọn schema đó; không ghi vào bảng ứng dụng.
