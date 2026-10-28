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

## Phụ đề có ở local nhưng mất sau khi deploy

`storage/` không nằm trong Git. Một container Railway mới không có các tệp đã tạo trên máy phát triển, và dữ liệu ghi vào filesystem tạm cũng có thể mất sau redeploy. Vì vậy, trạng thái danh mục có thể khác với dữ liệu thực tế trên máy chủ.

Các bản đã hoàn tất được đóng gói tại `resources/podcast-transcripts/`, ngoài thư mục static `public/`. Gói hiện có 134 video, 62.785 đoạn Anh–Việt; không chứa audio, khóa API hoặc các bản dịch còn dang dở. Mỗi tệp được nén riêng, có SHA-256 và số đoạn trong `manifest.json`.

`npm run build` kiểm tra toàn bộ checksum, câu và mốc thời gian, rồi chép gói vào `dist/resources/podcast-transcripts/`. Cần triển khai cả mã nguồn, manifest và các tệp `.json.gz`; không chỉ chép file TypeScript. Có thể kiểm tra riêng bằng:

```powershell
npm.cmd run verify:podcast-transcripts
npm.cmd run test:podcast-transcript-bundle
```

Backend ưu tiên phụ đề hợp lệ trong runtime `storage`, sau đó dùng bản đã đóng gói nếu runtime chưa có hoặc không đọc được. Các bản đóng gói không cần gọi lại dịch vụ nhận dạng/dịch, và vẫn đọc được sau khi khởi động lại với thư mục lưu trữ rỗng. Một trạng thái lỗi trước đó không chặn việc nhận tệp hoàn chỉnh được bổ sung sau này.

Chỉ API phụ đề mới phục vụ nội dung, sau khi kiểm tra video còn hiển thị và quyền Free/Premium. Gói này không được đưa vào frontend hoặc phục vụ trực tiếp qua đường dẫn static. Giới hạn 20 giây vẫn lọc các đoạn vượt phạm vi nghe thử.

Để cập nhật gói từ báo cáo các video đã hoàn tất có `id`, `file`, `duration`, `sha256` trong mảng `videos`:

```powershell
node scripts/podcast-transcript-bundle.mjs --from-report output/podcast-bilingual-generation-2026-10-27.json
```

Lệnh kiểm tra toàn bộ nguồn trước khi ghi, chỉ nhận đường dẫn `storage/featured-videos/<id>/transcript-v3.json` và giữ nguyên các tệp nguồn. Không đóng gói checkpoint hoặc bản dịch chưa đầy đủ. Khi tạo thêm phụ đề, cập nhật báo cáo và gói trong lần phát hành tiếp theo; các tệp mới chỉ có trong filesystem của production vẫn cần volume/lưu trữ bền vững để tồn tại qua redeploy.

12 video chưa có bản song ngữ hoàn chỉnh từ đợt tạo trước vẫn cần được tạo riêng. Bản sửa đóng gói khôi phục 134 video đã hoàn tất, không tự coi các checkpoint của 12 video đó là phụ đề sẵn sàng.
