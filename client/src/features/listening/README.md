# Mô-đun luyện nghe

Mở một bài nghe và bấm **Luyện tập**, hoặc truy cập `/bai-hoc/:id/luyen-tap`.
Bài `lesson-02` là bài miễn phí dùng để kiểm tra giao diện ở thời điểm triển khai.

## Phạm vi đã triển khai

- Player theo mốc thời gian từng câu, nghe lại, nghe chậm, 6 tốc độ, lặp câu; nghe liên tục trong chế độ Đọc.
- Điền từ: tỷ lệ ô trống 25/50/75%, gõ hoặc chọn thẻ từ, từ nhiễu, tùy chọn tự kiểm tra.
- Chép chính tả: gợi ý chữ đầu, từng từ hoặc toàn câu; so sánh đúng/sai/thiếu/thừa bằng căn chỉnh từ.
- Hiểu nghĩa: tự gõ hoặc sắp xếp bản dịch tiếng Việt; chấm theo bản dịch tham khảo, chưa chấm tương đương ngữ nghĩa bằng AI.
- Đọc: transcript tương tác, bản dịch, IPA có sẵn, cỡ chữ, giao diện cổ điển/thẻ câu, chuyển sang đọc thành tiếng.
- Đọc thành tiếng: một `ShadowingClient` riêng dùng dịch vụ có sẵn; chỉ yêu cầu micro khi bấm thu âm, dừng audio khi ghi, chặn phát mẫu trong khi ghi/chấm, giới hạn bản ghi 60 giây, hủy và dọn dẹp khi chuyển câu/rời trang. Điểm dựa trên lời nói được nhận dạng, không phải điểm âm vị/ngữ điệu.
- Hỗn hợp: tùy chọn các bài tập tham gia, làm hết các bước của câu hiện tại trước khi sang câu tiếp theo; khôi phục đúng bước sau tải lại.
- Transcript ẩn/hiện, danh sách từ lọc từ bài, tra nghĩa theo ngữ cảnh, phát âm/ví dụ và lưu vào bộ từ vựng qua API hiện có.
- Kết quả theo câu và chế độ, lọc câu dưới 80%, luyện lại không cộng trùng tiến độ, ghi nhận gợi ý nội bộ bài tập.
- Cài đặt, phím tắt trong phạm vi bài tập, tự phát lại khi dưới 80%, tự chuyển sau đạt mục tiêu, âm thanh phản hồi tùy chọn, kéo/chỉnh bằng bàn phím độ rộng khung nghe.
- Desktop hai cột và màn hình nhỏ xếp dọc; transcript/từ vựng thu gọn mặc định trên màn hình nhỏ.

## Ranh giới mô-đun

| Thư mục/tệp | Trách nhiệm |
| --- | --- |
| `ListeningLessonPage.tsx` | Quyền truy cập, kết nối player/bài tập, điều hướng và lưu tiến độ |
| `player/SegmentPlayer.ts` | Bộ điều khiển độc lập trên một audio element, không dùng player toàn cục |
| `player/useSegmentPlayer.ts` | Vòng đời audio/timer/listener trong React |
| `model/segments.ts` | Tạo đoạn ngắn/dài mà không sửa danh mục bài học |
| `model/grading.ts` | Chuẩn hóa Unicode và căn chỉnh đáp án theo từ |
| `model/exercises.ts` | Sinh ô trống/thẻ từ ổn định theo câu |
| `model/progress.ts` | Xác thực dữ liệu lưu, tổng hợp kết quả và bước Hỗn hợp |
| `components/` | Bài tập, cài đặt, đọc, kết quả và tra từ |
| `listening.css` | CSS giới hạn bằng tiền tố `lp-` |

Có hai điểm nối UI bên ngoài mô-đun: lazy route trong `App.tsx` và nút **Luyện tập** ở `LessonPage.tsx`. Toàn bộ ứng dụng cho phép truy cập trên cả thiết bị di động và máy tính.
Không thay đổi schema database, endpoint backend, dữ liệu bài học hay cách ghi lịch sử nghe hiện tại.
Vẫn sử dụng `useCanAccessLesson`, `useAuth`, API từ vựng và dịch vụ Shadowing hiện có; vì vậy availability/quyền truy cập của các dịch vụ này vẫn ảnh hưởng đến chức năng tương ứng.

## Tiến độ và chấm điểm

- Local storage có namespace `hihi:listening:v1`, tách tài khoản/khách, bài học và cách chia đoạn; cài đặt có namespace riêng theo tài khoản.
- Lưu câu hiện tại, chế độ, bước Hỗn hợp, tối đa 2.000 lượt làm. Không lưu bản nháp đang gõ và không đồng bộ tiến độ lên máy chủ.
- Đã làm và đạt mục tiêu là hai chỉ số riêng; đạt mục tiêu từ 80%. Lượt mới nhất của mỗi câu/chế độ được dùng để tổng hợp.
- Viết hoa, dấu câu và khoảng trắng được chuẩn hóa; giữ dấu tiếng Việt, số và dạng rút gọn tiếng Anh. Điền từ chỉ chấm ô trống.
- Gợi ý trong bài chép được ghi nhận. Hiện transcript/bản dịch và thẻ gợi ý không bị trừ điểm; điểm này dùng luyện tập, không dùng chứng nhận năng lực.
- Chế độ đoạn dài chỉ ghép các mệnh đề còn dang dở có dấu phẩy/chấm phẩy/hai chấm và mốc thời gian phù hợp, tối đa 25 giây. Bài gồm toàn câu hoàn chỉnh có thể giữ nguyên số đoạn.

## Kiểm thử

```sh
npm run test:listening
npm run typecheck:listening
node node_modules/vite/bin/vite.js build --config client/vite.config.ts --outDir ../output/listening-build
```

72 kiểm thử thuộc 7 nhóm trong `test/listening`: player/đoạn, chấm điểm, tiến độ, bài tập, vòng đời thu âm, tra từ, tích hợp trang.
Dịch vụ nhận dạng giọng nói và tra từ được giả lập trong kiểm thử; không gọi OpenAI thật hoặc bật micro của người dùng.

Đã kiểm tra trực tiếp bằng trình duyệt: bài nghe cũ → luyện tập → quay lại; điền đúng 100%; chép thiếu một từ và sửa lại; sắp xếp bản dịch; chuyển bước Hỗn hợp và tải lại; chế độ Đọc; trạng thái Pro; bố cục desktop và màn hình nhỏ không tràn ngang. Audio đã phát được trong phiên kiểm tra.
Build Vite và TypeScript giới hạn mô-đun đạt. Kiểm tra TypeScript toàn frontend còn 10 lỗi sẵn có ở ExplorePage, HistoryPage, ProfilePage, SpeakingHistoryPage và VocabularyPage, ngoài phạm vi thay đổi này.

## Phần tiếp theo chưa triển khai

- Trợ lý AI hỏi đáp theo câu/ngữ cảnh và chấm nghĩa tương đương bằng AI: đang chờ lựa chọn dùng lại `OPENAI_API_KEY` đã cấu hình hay tạo khóa mới theo quy trình skill OpenAI. Không có nút AI giả hoặc kết quả AI giả trong UI.
- Kiểm tra đầu-cuối micro thật và dịch vụ tra từ thật trong tài khoản phù hợp.
- Đồng bộ tiến độ lên máy chủ nếu cần; hiện tiến độ nằm riêng trong trình duyệt.

Chưa triển khai lên môi trường production.
