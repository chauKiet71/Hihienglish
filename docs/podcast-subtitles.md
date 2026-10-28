# Kiểm tra và xử lý phụ đề podcast

Công cụ kiểm tra toàn bộ video trong danh mục, kể cả video đang ẩn, và đọc các bản phụ đề có trên máy đang chạy lệnh. Video chưa có phụ đề được ghi là `MISSING`; công cụ không tự tạo phụ đề cho những video này.

Biên dịch backend để công cụ dùng đúng phiên bản xử lý câu hiện tại:

```powershell
npx.cmd tsc -p tsconfig.build.json --incremental false
node scripts/audit-podcast-subtitles.mjs
```

Lệnh mặc định chỉ kiểm tra. Báo cáo JSON trong `output/podcast-subtitles-*.json` ghi danh sách video, lỗi từng đoạn, phiên bản và mã SHA-256 của bản phụ đề ban đầu.

Tạo thêm phụ đề song ngữ cho các video chưa có, tối đa ba video cùng lúc:

```powershell
node scripts/audit-podcast-subtitles.mjs --apply --include-missing --workers=3
```

`--include-missing` chọn thêm các video `MISSING`; những bản đã đạt kiểm tra được bỏ qua. Có thể dùng `--limit=N` để chạy thử một số video ngắn trước. Mặc định vẫn chỉ sửa bản đã có lỗi, không tự tạo thêm phụ đề. `--workers` nhận giá trị từ 1 đến 3, mặc định 1.

Nếu OpenAI báo hết credits (`no credits remaining`, `insufficient_quota`), công cụ dừng lấy video mới và lưu lý do trong báo cáo. Bộ xử lý lô cũng dừng xếp yêu cầu mới khi gặp lỗi, chờ các lô đang chạy lưu xong điểm tiến độ rồi trả lỗi. Bổ sung credits cho tài khoản API đang dùng, sau đó chạy lại cùng lệnh để tiếp tục; các tệp đã hoàn tất và lô dịch hợp lệ được tái sử dụng. Giới hạn tốc độ tạm thời (`rate limit`) được phân biệt với việc hết credits.

Để xử lý các bản có lỗi:

```powershell
node scripts/audit-podcast-subtitles.mjs --apply
```

- Phát hiện đoạn vượt 40 từ hoặc 18 giây (trừ câu dưới 8 từ có khoảng im lặng dài), câu chồng nhau, bản dịch trống, mốc ngoài thời lượng video và mốc từ không hợp lệ.
- Các lô dịch bên trong vẫn dùng giới hạn đồng thời của pipeline. Ưu tiên phụ đề tiếng Anh có dấu câu. Tận dụng phụ đề gốc đã tải; nhận dạng âm thanh nếu chưa có nguồn phù hợp. Khoảng im lặng dài được giữ giữa hai câu, không kéo dài câu trước để lấp khoảng trống.
- Bản tiếng Anh có mốc thời gian và từng lô dịch được lưu riêng theo phiên bản pipeline (hiện là 16). Khi tiếp tục, chỉ nhận dạng/dịch các phần còn thiếu; thay đổi câu hoặc mốc thời gian làm thay khóa của lô dịch. Các bản tạm này không được phục vụ như phụ đề hoàn chỉnh.
- Âm thanh lớn hơn 20 MiB được chia thành phần tối đa 600 giây, PCM mono 16 kHz, để mỗi yêu cầu nhận dạng nằm trong giới hạn kích thước. Mốc thời gian của từng phần được cộng lại theo đúng vị trí trong video. Kết quả nhận dạng từng phần cũng được lưu; tệp WAV tạm được xóa sau khi nhận dạng thành công. Giữ nguyên audio nguồn để có thể tiếp tục khi gián đoạn.
- Lỗi chỉ nằm ở mốc từ được sửa từ dữ liệu hiện có, giữ nguyên tiếng Anh và bản dịch, không gọi dịch lại.
- Chỉ xuất bản phụ đề mới sau khi toàn bộ đoạn vượt qua kiểm tra. Ghi vào tệp tạm rồi đổi tên thành `transcript-v3.json`. Giữ nguyên `transcript-v2.json`; nếu thay bản v3 cũ, tạo thêm bản `.backup-*`.
- Lỗi tạo/dịch/kiểm tra của một video được ghi trong báo cáo, giữ nguyên bản cũ và tiếp tục video kế tiếp. Chạy lại sẽ bỏ qua các video đã xử lý thành công.
- Công cụ chỉ đọc danh mục từ cơ sở dữ liệu; không thay đổi độ hiển thị video, chính sách Premium, tài khoản hoặc từ đã lưu. Cần `DATABASE_URL`; cần cấu hình dịch đang dùng của backend khi phải tạo lại bản dịch. Không đưa khóa vào câu lệnh hay báo cáo.

Sau khi xử lý, khởi động lại đúng tiến trình backend của dự án nếu tiến trình đó đang giữ phụ đề cũ trong bộ nhớ. Không dừng một tiến trình chỉ vì nó đang dùng cổng 3000. Đây là thao tác trên dữ liệu của môi trường đang chạy lệnh; sửa trên local không tự thay phụ đề production. Khi triển khai production, chạy kiểm tra trên kho phụ đề của production rồi xử lý những bản được báo lỗi.

Kiểm thử công cụ:

```powershell
node --test test/subtitle-maintenance.test.mjs
```
