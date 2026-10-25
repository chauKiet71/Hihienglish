# Sổ từ vựng cá nhân

Phần `/tu-vung` dùng từ được người học chủ động lưu trong bài nghe, bài học Khám phá, luyện tập và video. Không đưa bộ từ có sẵn hoặc lịch sử học bộ từ cũ vào sổ mới.

## Dữ liệu và cập nhật database

- `SavedVocabularyWord`: snapshot từ, nghĩa theo ngữ cảnh, phiên âm, loại từ, chủ sở hữu và tiến độ ôn cách quãng.
- `SavedVocabularySource`: câu gốc và bản dịch lấy từ nguồn trên server, tên bài, loại nguồn, ID và khoảng thời gian.
- Các bảng cũ về bộ từ và tiến độ của chúng được giữ lại; không chạy thao tác xóa hoặc tự chuyển đổi dữ liệu thiếu nguồn.
- `prisma/schema.prisma` là schema chính. Cơ chế đồng bộ database khi khởi động hiện có sẽ tạo bảng mới, trừ khi `AUTO_SYNC_DB=false`.
- Môi trường tắt đồng bộ có thể áp dụng SQL thêm bảng tại `prisma/updates/20261025_saved_vocabulary.sql` một lần, rồi chạy `npm run db:generate`. SQL không xóa hay thay đổi bảng cũ. Không chạy lại file này khi bảng đã tồn tại.

## Hành vi

- Tra nghĩa không thêm vào sổ. Chỉ nút lưu mới tạo bản ghi cá nhân; lưu không tính là một câu trả lời đúng.
- Video công khai ở Podcast và Volka dùng chung nguồn `featured-video`, được server xác thực từ catalog. Tên bài, câu gốc và thời gian lấy từ đúng video; đường dẫn nghe lại giữ kênh Podcast hoặc bài Volka tương ứng.
- Cùng tài khoản, từ chuẩn hóa và nghĩa: upsert cùng một thẻ; bổ sung nguồn, không ghi đè snapshot hay đặt lại lịch ôn.
- Cùng từ với nghĩa khác có thể có thẻ riêng. Dữ liệu cá nhân không bị lần tra nghĩa của người khác ghi đè.
- `Ôn tất cả` bỏ các bộ lọc hiện tại và lấy toàn bộ từ đã lưu, bao gồm `MASTERED` và từ chưa đến hạn.
- `Ôn lại` áp dụng trạng thái và từ khóa tìm kiếm hiện tại. `Ôn lại từ này` tạo lượt ôn một từ. Hai ô chọn podcast và sắp xếp đã được bỏ khỏi giao diện; danh sách dùng thứ tự mới lưu mặc định.
- Hàng đợi ôn được chốt khi bắt đầu. Đáp án được ẩn cho tới khi người dùng yêu cầu xem.
- `Chưa nhớ` chuyển về `LEARNING` và hẹn ôn sớm. `Đã nhớ` cập nhật lịch SRS hiện có.
- Chỉ chuyển thẻ sau khi server ghi kết quả thành công. Mã yêu cầu và số lần ôn dự kiến ngăn ghi trùng hoặc ghi đè tiến độ từ tab khác.
- Giao diện sổ từ đã bỏ khung nghe lại nguồn, nút “Nghe lại trong podcast”, dòng định nghĩa phụ và lời nhắc “Bạn có thể ôn lại từ này bất cứ lúc nào” theo yêu cầu tinh gọn. Câu gốc, bản dịch, phát âm và ôn tập vẫn hiển thị. Nếu nguồn bị gỡ, snapshot thẻ vẫn tồn tại.

## API mới

Mọi endpoint dưới `/api/vocabulary/saved` yêu cầu đăng nhập và lọc theo người dùng từ JWT.

| Endpoint | Mục đích |
| --- | --- |
| `GET /` | Danh sách, thống kê và nguồn |
| `GET /session` | Hàng đợi theo bộ lọc, không mặc định giới hạn ở từ đến hạn |
| `POST /` | Lưu snapshot với nguồn được server xác thực |
| `DELETE /:id` | Bỏ lưu thẻ thuộc tài khoản hiện tại |
| `POST /:id/review` | Ghi đánh giá, kiểm tra requestId và expectedReviewCount |
| `GET /:id/sources/:sourceId/replay` | Kiểm tra nguồn và trả đường dẫn nghe lại |

Các endpoint bộ từ cũ được giữ để tương thích; giao diện mới và Trang chủ không gọi chúng. Tra từ tiếp tục tận dụng từ điển và dịch vụ AI hiện có, nhưng không tạo hay sửa từ trong bộ dùng chung.

## Kiểm tra

- Jest backend: lưu trùng, snapshot nguồn, quyền tài khoản, các phạm vi ôn, đổi trạng thái, chống gửi trùng và tiến độ cũ.
- Jest frontend: lọc `Đã nhớ`, ôn tất cả độc lập bộ lọc, popup ôn một từ, ẩn đáp án, gửi kết quả và phục hồi lỗi lưu.
- Các kiểm thử bài nghe và video hiện có tiếp tục chạy.
- Đã kiểm tra API thật bằng hai tài khoản QA riêng và trình duyệt bằng tài khoản QA. Tài khoản QA được dọn sau kiểm thử.
- Ảnh và đối chiếu thiết kế nằm trong `design-qa-evidence/vocabulary-*`; báo cáo được bổ sung trong `design-qa.md`.

TypeScript toàn client hiện có 6 lỗi ngoài phần Từ vựng: unused declarations ở ExplorePage, HistoryPage, ProfilePage và thiếu type `SpeakingCategory` ở SpeakingHistoryPage. Build Vite và TypeScript backend chạy độc lập được; không thay đổi các trang đó trong tác vụ này.
