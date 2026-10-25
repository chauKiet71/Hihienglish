# Nhập video và âm thanh

`AddVideoButton` được dùng chung ở Trang chủ và Video của tôi. Bấm Thêm video
mở hộp chọn nguồn ngay trên trang hiện tại, gồm URL Youtube và Phương tiện địa phương.

- URL Youtube mở hộp dán đường dẫn, giữ luồng tạo phụ đề hiện có.
- Phương tiện địa phương mở bộ chọn tệp; chọn tệp bắt đầu luồng nhập hiện có.
- Hộp thoại hiển thị tiến trình, kiểm tra trạng thái và mở bài học khi xử lý xong.
- Có thể đóng hộp chọn bằng Escape hoặc bấm bên ngoài. Cuộn trang được phục hồi
  khi hộp thoại đóng hoặc trang bị unmount.
- Nếu hết hạn mức, trang Nâng cấp nhận đúng nơi quay lại: `/` hoặc `/video-cua-toi`.

Kiểm thử: `npm run test:video-import`.
TypeScript phần liên quan: `npx tsc -p test/video-import/tsconfig.json`.
