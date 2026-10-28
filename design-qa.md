# Design QA — Các luồng xác thực HiHiEnglish

## 1. Luồng quên mật khẩu

**Nguồn thiết kế**

- `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-71e35b63-0ea5-4537-90df-a6dfcc162aa0.png`
- Kích thước nguồn: `1672 × 941`.
- Ba thẻ nguồn được cắt và chuẩn hóa về `430 × 870` pixel để đối chiếu trực tiếp.

**Bằng chứng triển khai**

- Quên mật khẩu: `D:\Code\ShowdingEng\backend\design-qa-evidence\forgot-password-final.png`
- Xác nhận email: `D:\Code\ShowdingEng\backend\design-qa-evidence\verify-email-final.png`
- Đặt mật khẩu mới: `D:\Code\ShowdingEng\backend\design-qa-evidence\reset-password-final.png`
- Di động — quên mật khẩu: `D:\Code\ShowdingEng\backend\design-qa-evidence\forgot-password-mobile-final.png`
- Di động — đặt mật khẩu mới: `D:\Code\ShowdingEng\backend\design-qa-evidence\reset-password-mobile-final.png`
- So sánh quên mật khẩu: `D:\Code\ShowdingEng\backend\design-qa-evidence\comparison-forgot-final.png`
- So sánh xác nhận email: `D:\Code\ShowdingEng\backend\design-qa-evidence\comparison-verify-final.png`
- So sánh đặt mật khẩu mới: `D:\Code\ShowdingEng\backend\design-qa-evidence\comparison-reset-final.png`

**Kết quả**

- Ba route dùng chung một shell responsive và giữ nguyên API, điều hướng, OTP, đếm ngược, quy tắc mật khẩu và nút hiện/ẩn mật khẩu.
- Global dark mode đã được vô hiệu hóa trong phạm vi luồng xác thực để khớp giao diện sáng.
- Không còn sai lệch P0/P1/P2 có thể hành động.

## 2. Đăng nhập và đăng ký

**Nguồn thiết kế**

- `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-cf57324f-9c0a-4c3a-9558-8ea2e7b29395.png`
- Kích thước nguồn: `1672 × 941`.
- Thẻ đăng nhập được đối chiếu ở `482 × 850` pixel.
- Thẻ đăng ký được đối chiếu ở `464 × 890` pixel.

**Bằng chứng triển khai**

- Đăng nhập hiện tại: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-login-current.png`
- Đăng ký hiện tại: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-register-current.png`
- So sánh đăng nhập, nguồn bên trái / triển khai bên phải: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-login-comparison.png`
- So sánh đăng ký, nguồn bên trái / triển khai bên phải: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-register-comparison.png`

**Trạng thái kiểm thử**

- Đăng nhập: trạng thái rỗng, kiểm tra lỗi khi gửi thiếu email/mật khẩu, kiểm tra nút hiện mật khẩu và liên kết quên mật khẩu.
- Đăng ký: trạng thái rỗng, kiểm tra lỗi khi thiếu họ tên, nút hiện mật khẩu, checkbox chính sách và liên kết sang đăng nhập.
- Google OAuth: giữ nguyên hàm điều hướng `/api/auth/google`; không khởi chạy đăng nhập thật trong QA.
- Giao diện di động: kiểm tra ở viewport CSS quan sát được `417 × 902`; không có overflow ngang, cả hai màn hình nằm gọn trong viewport.
- Theme: ứng dụng đang ở dark mode toàn cục, nhưng hai thẻ xác thực chủ động giữ light mode giống nguồn.

**Độ trung thực**

- Bố cục: vị trí logo, tiêu đề, vùng form, CTA, đường phân cách, Google button và footer khớp nhịp dọc của ảnh mẫu.
- Kiểu chữ: giữ Inter/system sans-serif, tiêu đề navy đậm, nội dung phụ xám và liên kết xanh.
- Trường nhập: chiều cao, bo góc, viền, icon, placeholder và focus ring đồng nhất giữa hai trang.
- Màu sắc: sử dụng nền raster trắng–lavender với vòm xanh tím lớn và CTA raster xanh–tím; không dùng placeholder hay emoji.
- Tài sản thương hiệu: dùng lại wordmark HiHiEnglish hiện có và icon Google hiện có.
- Responsive: desktop dùng thẻ bo tròn có shadow; màn hình nhỏ chuyển sang layout trắng toàn màn hình.
- Khả năng truy cập: có semantic heading, aria-label, focus-visible, trạng thái disabled, autocomplete và vùng chạm thực tế.

**Lịch sử so sánh**

1. Bản đầu phát hiện chữ Google bị global dark mode đổi sang màu sáng.
2. Đã thêm override light-mode có scope cho Google button.
3. Đối chiếu lại toàn thẻ cho thấy không còn sai lệch P0/P1/P2.
4. Checkbox đăng ký vẫn mặc định chưa chọn để người dùng chủ động đồng ý chính sách; đây là khác biệt có chủ ý so với trạng thái đã chọn trong mock.

**Kiểm tra kỹ thuật**

- [x] Production client build hoàn tất.
- [x] Không có lỗi browser console trong lượt QA cuối.
- [x] Không có overflow ngang ở màn hình nhỏ.
- [x] Giữ nguyên logic đăng nhập, đăng ký, Google OAuth và điều hướng.
- [x] Không gửi dữ liệu đăng nhập/đăng ký thật trong QA.

## 3. Điều chỉnh khoảng cách ô nhập — 20px

**Nguồn thay đổi**

- Đăng nhập: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-fb6b522b-78fc-413e-a11f-0ea9718336fd.png` (`495 × 136`).
- Đăng ký: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-f69fc448-3426-4ea7-8587-d607aca403b9.png` (`495 × 136`).
- Yêu cầu định lượng của người dùng: khoảng cách dọc giữa các ô nhập là `20px` trên cả hai trang.

**Bằng chứng triển khai**

- Đăng nhập: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-login-gap20.png` (`468 × 778`).
- Đăng ký: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-register-gap20.png` (`468 × 778`).
- So sánh vùng nhập đăng nhập, nguồn bên trái / triển khai bên phải: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-login-gap20-comparison.png`.
- So sánh vùng nhập đăng ký, nguồn bên trái / triển khai bên phải: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-register-gap20-comparison.png`.
- Browser computed style xác nhận `.account-auth-fields` có `gap: 20px` tại `/dang-nhap` và `/dang-ky`.
- Trạng thái: form rỗng, light-mode xác thực, viewport trình duyệt trong ứng dụng `468 × 778`, không overflow ngang ở trang đăng ký.

**Kết quả kiểm tra**

- Spacing/layout: hai trang dùng cùng khoảng cách `20px`; không còn nhịp dọc `40px`/`36px` trước đó.
- Typography, màu, hình nền, icon, nội dung và kích thước trường nhập không thay đổi.
- Logic form, Google OAuth, nút hiện mật khẩu, checkbox và điều hướng được giữ nguyên.
- Không còn sai lệch P0/P1/P2 đối với yêu cầu khoảng cách mới.

## 4. Điều chỉnh kích thước checkbox đăng ký

**Nguồn thay đổi**

- Browser Comment 1 tại `/dang-ky`, selector `.account-auth-agreement > input`, viewport chú thích `471 × 784`.
- Ảnh trạng thái trước thay đổi dùng làm nguồn đối chiếu: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-register-gap20.png` (`468 × 778`).
- Mục tiêu: checkbox có kích thước thị giác cân với dòng chữ chính sách, không thay đổi các thành phần lân cận.

**Bằng chứng triển khai**

- Ảnh toàn trang sau thay đổi: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-register-checkbox-text-size.png` (`468 × 778`).
- So sánh vùng checkbox, trạng thái cũ bên trái / trạng thái mới bên phải: `D:\Code\ShowdingEng\backend\design-qa-evidence\account-register-checkbox-comparison.png` (`660 × 54`).
- Trình duyệt xác nhận checkbox `14 × 14px`, chữ `13px` với line-height `19.5px`, căn giữa bằng margin-top `2.75px`.

**Kết quả kiểm tra**

- Checkbox mới có chiều cao thị giác tương đương chữ, không còn lớn vượt trội như trạng thái `21 × 21px` trước đó.
- Trạng thái chưa chọn và đã chọn đều hoạt động; checkbox vẫn được gắn đúng nhãn truy cập.
- Typography, màu, ảnh, nội dung, khoảng cách form `20px` và logic đăng ký không thay đổi.
- Không có overflow ngang hoặc sai lệch P0/P1/P2.

## 5. Login form box size reduction (30%)

**Source visual truth**

- Browser Comment 1 on `/dang-nhap`, targeting `.account-auth-form` at a `418 x 776` CSS viewport.
- Pre-change capture: `D:\Code\ShowdingEng\backend\design-qa-artifacts\login-before.jpg` (`414 x 769` pixels from the browser capture backend).
- Normalized source: `D:\Code\ShowdingEng\backend\design-qa-artifacts\login-before-normalized.jpg` (`418 x 776` pixels).
- User requirement: reduce the login form boxes by 30% while preserving the surrounding login screen.

**Implementation evidence**

- Final capture: `D:\Code\ShowdingEng\backend\design-qa-artifacts\login-after-final.jpg` (`418 x 776` pixels).
- Side-by-side normalized comparison, source on the left and implementation on the right: `D:\Code\ShowdingEng\backend\design-qa-artifacts\login-normalized-comparison.jpg` (`836 x 776` pixels).
- CSS viewport: `418 x 776`; device pixel ratio reported by the page: `1.125`.
- State: light theme, empty login form, no validation or loading state.

**Full-view comparison evidence**

- Email and password boxes changed from `66px` to `46px` (`30.30%` reduction).
- Primary login button changed from `64px` to `45px` (`29.69%` reduction).
- Google button changed from `64px` to `45px` (`29.69%` reduction).
- The form width, logo, heading, copy, colors, icons, and footer content were preserved.
- The full form height changed from `430.5px` to `312.5px`; this is a `27.41%` reduction because readable text line heights remain unchanged.
- Focused image crops were not needed: every changed control is clearly legible in the normalized `418 x 776` side-by-side comparison, and computed dimensions provide exact focused evidence.

**Required fidelity surfaces**

- Fonts and typography: font family, sizes, weights, and copy are unchanged; only box geometry and associated vertical rhythm changed.
- Spacing and layout rhythm: input gap and the forgot-link, CTA, and divider margins were reduced proportionally; no horizontal overflow is visible.
- Colors and visual tokens: borders, blue-violet CTA treatment, link color, backgrounds, and contrast are unchanged.
- Image quality and asset fidelity: the HiHiEnglish wordmark, Google icon, and CTA raster treatment remain the existing production assets and render sharply.
- Copy and content: all login copy is unchanged.

**Comparison history**

1. Initial implementation reduced inputs and the primary CTA by about 30%, but the Google button remained `50.78px` tall because inherited vertical padding limited it to a `20.66%` reduction. This was a P2 mismatch against the explicit numeric request.
2. The login-scoped Google button padding was reset and its height fixed at `45px`.
3. Post-fix evidence confirms all requested boxes are within `0.31` percentage points of the 30% target; no actionable P0/P1/P2 findings remain.

**Interaction and technical checks**

- Password visibility toggles from `password` to `text` and back to `password`.
- Production client build passes.
- Browser console reports no errors in the final QA state.
- Login submission and Google OAuth were not triggered, so no account data was transmitted.

## 6. Speaking scenario card redesign

**Source visual truth**

- Browser Comment 1 additional image attachment: the compact “Marketing Strategy” card supplied in the current conversation. The attachment renderer did not expose a local filesystem path.
- Displayed source crop: approximately `330 × 88px`; visible card: approximately `322 × 70px`.
- Target characteristics: compact bordered card, `12px` corner radius, subtle elevation, `40px` circular icon, title and green difficulty badge on one row, and a small gray description below.

**Implementation evidence**

- Full active-theme capture: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-scenario-cards-implementation.png` (`414 × 769px` browser capture).
- Focused card crop: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-scenario-card-focused.png` (`382 × 68px`).
- Source-width responsive capture: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-scenario-cards-source-width.png`.
- Source-width focused crop: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-scenario-card-source-width-focused.png` (`323 × 68px`).
- CSS viewport for the main capture: `418 × 776`; device pixel ratio: `1.125`.
- Normalized responsive state: the first card measured `322.67 × 68px` in CSS, matching the source card width; it returns to `382.22 × 68px` at the active `418px` viewport.
- State: `/luyen-noi`, dark theme selected by the application, A2 level selected, no loading or error state.

**Full-view and focused comparison**

- The source attachment and the source-width focused implementation crop were compared together in the current visual QA pass. Both use the same compact hierarchy: circular icon, title plus a small green badge, then description.
- The implementation keeps the existing dark theme as an intentional product constraint; border, background, icon tint, and badge colors are token-adapted equivalents of the light reference.
- At source width, the card is within roughly `2px` of the source height and within `1px` of the source width. The icon is exactly `40 × 40px`; border radius is `12px`.
- The surrounding screen is unchanged except that the denser cards allow more topics above the fixed bottom navigation. No horizontal overflow or clipped card content is visible.
- Focused evidence is required because the supplied source covers only the card component; the full-screen capture is used to verify integration and surrounding-layout preservation.

**Required fidelity surfaces**

- Fonts and typography: existing Inter/system sans is retained; title uses a compact semibold `13px/18px` treatment, badge uses `9px`, and description uses `11px/15px`. Copy remains legible at the smallest tested width.
- Spacing and layout rhythm: `12px` horizontal card padding, `10px` vertical padding, `12px` icon/content gap, `12px` radius, `68px` minimum height, and a subtle one-pixel shadow reproduce the source density.
- Colors and visual tokens: the green difficulty badge maps to `Dễ`; `Vừa` uses amber and `Khó` uses rose. Existing scenario accent colors and dark-mode tokens are preserved.
- Image quality and asset fidelity: no raster assets are present in the source card. Existing Lucide scenario icons remain vector-sharp and are presented in the source’s circular icon treatment.
- Copy and content: scenario title and description are preserved. Role information remains available to assistive technology while being visually removed to match the compact reference.

**Comparison history and findings**

1. The original cards were roughly `106px` tall, used rounded-square icons, lacked a difficulty badge, and displayed an extra visible role line. This was the principal P1 mismatch against the supplied component reference.
2. The cards were rebuilt with the compact source structure and responsive sizing. The first implementation measured `382.22 × 68px` at the active viewport and `322.67 × 68px` at the normalized source width.
3. Post-fix visual comparison found no actionable P0/P1/P2 differences. The light-source/dark-implementation color difference is an intentional theme adaptation rather than design drift.

**Interaction and technical checks**

- A2 and B1 filters remain interactive; B1 correctly exposes one `Vừa` card and A2 restores nine `Dễ` cards.
- Scenario buttons remain enabled and preserve the existing start-session handler; no real speaking session was created during QA.
- Production client build passes.
- Browser console reports no errors in the final QA state.

### 6.1. Shared conversation icon for every scenario

**Source visual truth**

- Browser Comment 1 additional image attachment in the current conversation: two overlapping blue chat bubbles centered in a pale-blue circular tile.
- Visible source icon tile: approximately `40 × 40px`; the attachment renderer did not expose a local filesystem path.

**Implementation evidence**

- Full browser capture: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-scenario-cards-shared-icon.png`.
- Focused icon crop: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-shared-icon-focused.png` (`42 × 42px`, containing the `40 × 40px` tile).
- CSS viewport: `418 × 776`; device pixel ratio: `1.125`; route `/luyen-noi`; dark theme; A2 selected.

**Comparison and fidelity surfaces**

- Full-view comparison confirms all nine visible scenario cards now use the same icon without changing card height, text wrapping, spacing, badges, navigation, or list behavior.
- Focused comparison confirms the source structure: filled overlapping speech bubbles, blue foreground, pale-blue circular background, and centered `40px` tile.
- Browser-computed values are identical across sampled cards: tile `40 × 40px`, background `rgb(243, 246, 255)`, foreground `rgb(52, 120, 246)`.
- Typography and copy are unchanged. Layout rhythm remains `12px` between icon and content. Colors match the supplied icon direction in both application themes. The icon uses the existing vector icon library, so edges remain sharp and no raster placeholder, emoji, CSS drawing, or handcrafted SVG is introduced.

**Findings and checks**

- The previous per-scenario icons were the only P1 mismatch against this new annotation. They were replaced with the shared conversation icon.
- Post-fix DOM inspection confirms `9` scenario cards and `9` `messages-square` icons.
- Production client build and Prettier check pass.
- Browser console reports no errors; no speaking session or external side effect was triggered.
- No actionable P0/P1/P2 findings remain.

### 6.2. Exact user-supplied chat icon asset

**Source visual truth**

- `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-b18bcce2-e6f3-4542-a6be-9a0d15820959.png` (`134 × 89px`, opaque ARGB raster).
- The supplied image contains two filled blue speech bubbles on a pale-blue background. Its visible blue artwork bounds are approximately `71 × 57px` inside the source raster.

**Implementation evidence**

- Project asset copy: `D:\Code\ShowdingEng\backend\client\public\images\speaking\chat-bubbles.png`.
- Full browser capture: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-scenario-cards-exact-chat-asset.png`.
- Focused implementation crop: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-exact-chat-icon-focused.png` (`42 × 42px`).
- Normalized comparison, source on the left and browser implementation on the right: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-exact-chat-icon-comparison.png` (`92 × 42px`).
- CSS viewport: `418 × 776`; device pixel ratio: `1.125`; route `/luyen-noi`; dark theme; A2 selected.

**Full-view and focused comparison**

- Full-view comparison confirms all nine visible cards now load the exact supplied PNG rather than a library approximation.
- The source raster is rendered at `40 × 26.56px` inside the existing `40 × 40px` circular tile. This keeps the source artwork at approximately `21 × 17px`, matching its original internal scale.
- The circular mask and `rgb(240, 244, 255)` tile background integrate the opaque rectangular source without a visible edge. The focused side-by-side comparison confirms identical bubble silhouette, overlap, blue tones, antialiasing, and artwork proportions.

**Required fidelity surfaces and findings**

- Fonts and typography: unchanged.
- Spacing and layout rhythm: card geometry, `40px` icon tile, `12px` content gap, badges, and list density are unchanged.
- Colors and tokens: the tile background matches the source corner color; source blue pixels are preserved because the original raster is used directly.
- Image quality and asset fidelity: the exact user-supplied `134 × 89px` raster is used; no SVG, icon-library substitute, emoji, CSS drawing, or generated approximation remains.
- Copy and content: unchanged; the decorative image uses empty alt text so it does not duplicate each button's accessible label.
- DOM inspection confirms `9` scenario cards and `9` instances of `/images/speaking/chat-bubbles.png`, all with the correct natural dimensions.
- Production client build and Prettier check pass; browser console reports no errors.
- The prior library approximation was the only P1 mismatch. It has been replaced, and no actionable P0/P1/P2 findings remain.

### 6.3. Dark-mode icon tile

**Source visual truth**

- `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-12d55904-303b-4c42-ab18-66290781b5b6.png` (`61 × 68px`).
- User requirement: when the application is in dark mode, the icon tile must use a dark surface instead of retaining the light circular background shown in the source capture.

**Implementation evidence**

- Full browser capture: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-scenario-cards-dark-icon-tile.png`.
- Focused dark icon crop: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-dark-icon-focused.png` (`42 × 42px`).
- Before/after comparison, supplied light tile on the left and implemented dark tile on the right: `D:\Code\ShowdingEng\backend\design-qa-evidence\speaking-dark-icon-before-after.png` (`100 × 50px`).
- Transparent source-derived asset: `D:\Code\ShowdingEng\backend\client\public\images\speaking\chat-bubbles-transparent.png` (`134 × 89px`).
- CSS viewport: `418 × 776`; device pixel ratio: `1.125`; route `/luyen-noi`; A2 selected; confirmed `<html class="dark">` state.

**Full-view and focused comparison**

- Full-view comparison confirms all nine icon tiles now follow the dark card palette instead of appearing as bright white circles.
- Focused before/after evidence shows the tile changing from the supplied pale surface to `dark:bg-neutral-800` while retaining the exact blue chat-bubble artwork, scale, alignment, and circular `40 × 40px` geometry.
- The original opaque pale matte was removed from a copy of the user-supplied PNG so the image can sit cleanly on both theme surfaces without a rectangular halo.

**Required fidelity surfaces and findings**

- Fonts and typography: unchanged.
- Spacing and layout rhythm: card size, tile size, icon scale, content gap, badges, and list density are unchanged.
- Colors and tokens: light mode keeps `#f0f4ff`; dark mode uses the existing neutral-800 token (`oklch(0.269 0 0)` in the browser) for a coherent dark surface.
- Image quality and asset fidelity: the two blue bubbles remain source-derived and sharply rendered; the transparent matte has no visible pale or rectangular edge in the focused browser capture.
- Copy and content: unchanged; decorative images remain hidden from accessibility names.
- Browser inspection confirms dark mode is active and all `9` cards load the transparent asset.
- Production client build and Prettier check pass; browser console reports no errors.
- The light tile in dark mode was the only P1 mismatch. It has been corrected, and no actionable P0/P1/P2 findings remain.

final result: passed

## Nút “Thêm video” — trang Video của tôi

**Nguồn thiết kế**

- Nút đang dùng trên trang chủ, được chụp tại `D:\Code\HihiEnglish\21th9\Hihienglish\design-qa-evidence\home-add-button-reference.png`.
- Ảnh chú thích của người dùng xác nhận vị trí mong muốn: góc dưới bên phải, phía trên thanh điều hướng.

**Bằng chứng triển khai**

- Toàn màn hình: `D:\Code\HihiEnglish\21th9\Hihienglish\design-qa-evidence\my-videos-add-button-implementation.png`.
- So sánh vùng nút, nguồn bên trái / triển khai bên phải: `D:\Code\HihiEnglish\21th9\Hihienglish\design-qa-evidence\add-video-button-comparison.png`.
- Viewport CSS được quan sát: `724 × 683`, `devicePixelRatio: 1`; hai ảnh chụp đều `720 × 678` pixel nên không cần chuẩn hóa mật độ.
- Trạng thái: dark theme, danh sách video đã tải xong, nút CTA và thanh điều hướng cùng hiển thị.

**Đối chiếu toàn màn hình**

- Bố cục, header, bộ lọc, danh sách và thanh điều hướng của trang “Video của tôi” được giữ nguyên.
- CTA nằm trong khung `max-w-lg`, cách cạnh phải khung nội dung `20px` và cách đáy viewport khoảng `70px`, đúng vị trí nổi phía trên thanh điều hướng. Ở viewport chú thích rộng `418px`, khoảng cách cạnh phải vẫn là `20px`.

**Đối chiếu vùng trọng tâm**

- So sánh tập trung là cần thiết vì thay đổi chỉ nằm ở CTA. Ảnh ghép cho thấy nút nguồn và nút triển khai cùng chiều cao `48px`, bo tròn dạng pill, icon video, chữ đậm và gradient xanh tím.
- Không có sai lệch P0/P1/P2.

**Required fidelity surfaces**

- Fonts and typography: chữ `Thêm video` dùng cùng cỡ `14px`, trọng lượng `700` và cùng nhịp chữ với trang chủ.
- Spacing and layout rhythm: cùng chiều cao, padding ngang, khoảng cách icon–nhãn, bán kính, shadow và vị trí nổi; `pb-24` bảo vệ nội dung cuối danh sách khỏi CTA.
- Colors and visual tokens: dùng nguyên gradient `primary` → `secondary`, chữ trắng và shadow indigo của nút trang chủ.
- Image quality and asset fidelity: không có raster asset mới; icon `Video` dùng cùng thư viện và cùng thông số `19px`, `strokeWidth 2.6` như nguồn.
- Copy and content: nhãn hiển thị và `aria-label` đều là `Thêm video`.

**Comparison history**

1. Bản triển khai đầu tiên tái sử dụng trực tiếp kiểu và thông số của CTA trang chủ.
2. Đối chiếu toàn màn hình và vùng nút không phát hiện sai lệch P0/P1/P2; không cần vòng sửa hình ảnh tiếp theo.

**Interaction and technical checks**

- Click nút mở đúng `/dich-video`.
- Production client build hoàn tất.
- Browser console không có lỗi.

final result: passed

## 19. Home floating add-video action

**Source visual truth**

- User reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-cd1f0f0d-017c-40a0-a06e-a3e3a14f87d2.png`.
- Requested placement: lower-right floating action, `40px` from the app's right edge and `200px` from the viewport bottom.

**Implementation and interaction checks**

- The home page renders a blue pill action with the existing Lucide video icon and the label `Them video`.
- Browser measurement at a `432 x 630px` viewport reports a `48px` button height, `199.6px` bottom offset, and `40px` right offset from the layout viewport. The document has no horizontal overflow.
- Activating the action opens the video-source bottom sheet without leaving the home page.
- TypeScript validation, the production client build, and `git diff --check` pass. Browser console reports no warnings or errors.

final result: passed

## 20. Home add-video source bottom sheet

**Source visual truth**

- User reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-c833e697-54c2-4727-95f4-daa39f23ce55.png` (`467 x 307px`).
- Requested interaction: slide up after activating `Thêm video`; slide down and close after tapping anywhere outside the sheet.

**Implementation evidence**

- Final browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\home-add-video-sheet-open.png` (`1280 x 720px`) with the production home page rendered in its centered `512px` application column.
- Source/implementation comparison: `D:\Code\ShowdingEng\backend\output\design-qa\home-add-video-sheet-comparison.png`.
- The sheet preserves the application's light/dark color tokens while matching the reference's rounded top, heading hierarchy, compact subtitle, two bordered source rows, and icon/text alignment.

**Interaction and technical checks**

- The existing `320ms` sheet-in and `240ms` sheet-out animations drive the vertical motion; the backdrop fades in and out at the same time.
- Tapping the backdrop removes the dialog and restores body scrolling. `Escape` closes it through the same path.
- `URL Youtube` closes the source sheet and opens the compact URL dialog directly on Home.
- `Phương tiện địa phương` opens the native file chooser while Home remains visible; cancelling the chooser leaves the source sheet in place.
- Reduced-motion users receive the same behavior without animation. TypeScript, production build, `git diff --check`, and browser console checks pass.

final result: passed

## 21. Home Youtube URL dialog and background-processing flow

**Source visual truth**

- User reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-e74dc207-8de0-4b9f-878d-6d6b3416b075.png` (`295 x 214px`).
- Requested flow: selecting `URL Youtube` opens the compact URL dialog; activating `Lưu` starts video processing without leaving Home. The learning player opens only after the job is ready.

**Implementation evidence**

- Final browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\home-youtube-url-dialog.png` (`1280 x 720px`) with the production home page rendered in its centered application column.
- Source/implementation comparison: `D:\Code\ShowdingEng\backend\output\design-qa\home-youtube-url-dialog-comparison.png`.
- The dialog matches the reference hierarchy and spacing: title, single URL field, paired `Đóng`/`Lưu` actions, rounded surface, and dimmed page backdrop. Colors use the application's existing primary palette.

**Interaction and technical checks**

- `Đóng`, backdrop click, and `Escape` dismiss the dialog without navigation.
- `Lưu` requires a non-empty URL and calls `createVideoTranslateJob()` directly from Home. The browser URL remains `/`; the Dịch video input/processing screen is never rendered.
- While the created job is `PENDING` or `PROCESSING`, Home keeps the dialog open in a non-dismissible `Đang xử lý video` state and polls the existing job endpoint once per second.
- A `READY` response navigates with the completed job in router state. `VideoTranslatePage` initializes from that state, bypasses its loading/input screen, and immediately renders the learning player with playback prepared from the beginning. The job id remains in the URL as a reload fallback.
- `FAILED` and request errors restore the URL form inside the Home dialog, preserving the entered URL and displaying the backend message without navigating away.
- Browser verification with a deliberately unavailable 11-character Youtube ID confirmed that the URL stayed `http://localhost:3000/` immediately after `Lưu`, the `Đang tạo phụ đề Youtube` state appeared, and the handled `Video unavailable` error returned in the same dialog. No ready/recent item was created by the test.
- Processing-state capture: `D:\Code\ShowdingEng\backend\output\design-qa\home-youtube-processing-dialog.png`.
- Browser verification with an existing cached `READY` video confirmed the complete success path: Home submitted the URL, navigation occurred only after the API response, and the destination immediately contained the YouTube player, translated transcript, vocabulary word actions, and `Shadowing` controls with no link-entry screen.
- Ready learning-player capture: `D:\Code\ShowdingEng\backend\output\design-qa\home-youtube-ready-learning.png`.
- TypeScript, production client build, `git diff --check`, and browser console checks pass.

final result: passed

## 24. Home local-media background-processing flow

**Requested flow**

- Selecting `Phương tiện địa phương` lets the user choose a supported video or audio file from the device.
- After file selection, processing begins directly from Home and the learning player opens only when the job reaches `READY`.

**Implementation and interaction checks**

- The source row uses a native file input layered over the existing visual treatment, preserving direct pointer, keyboard, and assistive-technology access to the device picker.
- Supported formats match the existing video-translation upload flow: MP4, WebM, MOV, MP3, M4A, and WAV.
- Home calls `createVideoTranslateJobFromUpload()` immediately after selection. While the job is pending, a non-dismissible dialog shows the selected filename and translation progress; the shared one-second poller handles both URL and local jobs.
- A `READY` response passes the complete job through router state and opens the learning player without rendering the Dịch video upload screen. Request and processing failures remain in the Home dialog with `Đóng` and `Chọn lại` actions.
- Browser verification uploaded `storage/video-translate-audio-benchmark.mp3` from the Home source sheet. The completed job navigated directly to `/dich-video?job=c21c2b90-ce70-4082-80c5-b4535dbea9e4`, where the audio title, translated transcript, vocabulary actions, playback controls, and Shadowing action rendered successfully.
- Ready-state capture: `D:\Code\ShowdingEng\backend\output\design-qa\home-local-upload-ready.png`.
- Browser console warnings/errors: none.

final result: passed

## 23. Lesson bottom control bar layout

**Source visual truth**

- Browser Comment 1 on `/bai-hoc/lesson-04` requested the existing fixed lesson controls to adopt the attached single-row layout while preserving the application's current light/dark color tone.
- Required order: `Tốc độ`, `Dịch`, `Phiên âm`, `Lặp lại`, then a larger highlighted `Nói` action.

**Implementation evidence**

- The former utility row plus full-width Shadowing button is now one five-column control bar.
- The four utility controls use spacing instead of vertical dividers; the final speaking control remains visually dominant and keeps the existing primary-to-secondary gradient.
- Existing behavior is preserved: the speed menu exposes five rates, translation/phonetic/repeat retain their toggle states, recording remains red, and scoring remains disabled with the existing loader-only state.
- The translated-video player now uses the same control order, proportions, labels, and divider-free treatment while retaining its existing video-specific test hooks and playback handlers.

**Interaction and technical checks**

- Browser QA at `530 x 706px` confirmed the exact requested order and stable button dimensions (`76px` utility height, `68px` speaking height).
- Selecting `0.75x` updates the audio element's playback rate to `0.75`; the phonetic and repeat controls remain interactive.
- The document has no horizontal overflow, labels fit their cells, and the fixed bar does not shift between controls.
- Production client build and independent client TypeScript compilation pass.

final result: passed

## 22. Lesson video controls auto-hide

**Source and rendered evidence**

- User reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-ee205bb6-1a0f-40a5-ab2a-754f7a55222b.png`.
- Visible-state browser capture: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-shown-qa.png`.
- Hidden-state browser capture: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-hidden-qa.png`.
- Side-by-side reference comparison: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-reference-comparison.png`.
- Centered-caption browser capture: `C:\Users\DELL\AppData\Local\Temp\lesson-caption-centered-qa.png`.
- Tap-toggle browser capture: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-tap-toggle-qa.png`.
- Compact-controls reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-da1533af-6b8e-4239-a54c-fa9748327d8d.png` (`491 x 74px`).
- Compact-controls final capture: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-compact-final.png` (`1280 x 720px`).
- Focused side-by-side comparison: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-compact-comparison.png` (`990 x 74px`).
- Transparent-controls final capture: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-no-background.png` (`1280 x 720px`).
- Restored-controls final capture: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-restored-final.png` (`498 x 544px`).
- Ended-state replay capture: `C:\Users\DELL\AppData\Local\Temp\lesson-controls-ended-replay.png` (`498 x 544px`).
- Test state: `/bai-hoc/lesson-02` at the user's current `498 x 544px` viewport.

**Interaction and visual checks**

- The restored controls show previous sentence, a large centered play/pause action, next sentence, separate current/duration labels, progress, and fullscreen. They appear when the lesson opens, remain available for 2 seconds, then fade and move down over 500ms.
- Clicking anywhere on the video surface reveals the controls with the reverse smooth transition and restarts the 2-second timer.
- When the controls are already visible, tapping the video surface immediately starts the hide transition. Tapping the hidden surface reveals them again.
- Clicks inside the control group stop propagation and restart the 2-second timer, so playback, seek, and fullscreen actions do not accidentally hide the controls.
- The active English caption remains visible while the controls are hidden.
- The caption uses an independent full-surface centering layer. Browser geometry for `I can pay by credit card.` reports a vertical center delta of approximately `0.000004px` from the video surface center.
- Hidden controls use `inert`, `aria-hidden`, and disabled pointer events so invisible buttons cannot receive interaction.
- The latest layout matches the supplied reference hierarchy: a `56px` circular primary control centered between two `36px` sentence controls, with the timeline and timestamps aligned below it.
- The separate black control-band fill was removed. Browser-computed background color is fully transparent (`rgba(0, 0, 0, 0)`), so the controls now sit directly over the video image while retaining their spacing and contrast.
- The next-sentence control advanced to `First, I go to the check-in desk.` and resumed playback. Clicking the middle of the restored progress track set the live audio ratio to `0.5009`, confirming both restored controls remain functional and synchronized.
- When playback reaches the native audio `ended` event, the controls are forced visible and remain visible beyond the normal 2-second timeout. The center action changes from Play to a white circular replay icon with the accessible label `Phát lại từ đầu`.
- Activating replay reset the audio from `28.081625` seconds to `0.294414` seconds during the first verification sample, resumed playback, restored the Pause icon, and re-enabled the normal 2-second auto-hide behavior.
- Replay now resets the transcript without smooth scrolling. Browser verification started at transcript `scrollTop 1582.4`; within the first `20ms` sample after clicking replay it was already `0`, the caption was the first sentence, and audio had restarted at `0.031092` seconds. The settled `250ms` sample remained at `scrollTop 0`.
- The progress fill transition was removed so it resets in the same frame as replay. From the ended state (`matrix(1, 0, 0, 1, 0, 0)`), the first `20ms` sample showed `transitionDuration: 0s`, audio at `0.030272` seconds, and the fill at approximately `0.1%`; there is no reverse-slide animation.
- The active transcript card no longer uses a primary-blue border or focus-like outer shadow. Browser-computed styles confirm the subtle active background remains, the border is the neutral `gray-100` token, `boxShadow` is `none`, and card width remains stable at `357.6px` in the current mobile viewport.
- Inactive transcript cards now inherit the surrounding transcript surface visually: both their background and border compute to fully transparent `rgba(0, 0, 0, 0)`. Their padding, radius, text hierarchy, word interaction, and sentence-seek behavior remain unchanged.
- Selecting a transcript sentence while audio is paused now seeks to that sentence and immediately resumes playback at the current speed. Browser verification clicked `I am going to London.` from a paused `0s` state and observed `paused: false`, the matching caption, playback rate `1`, and audio advancing from the sentence start.
- Lesson repeat no longer delegates to the native audio `loop` attribute. At the end of a repeated lesson, the application resets audio time, progress, active sentence, and transcript position together before immediately resuming playback.
- Browser boundary verification started on the final sentence at `28.511s` with transcript `scrollTop 1668.8`; just before the end it was at `30.303s` and `scrollTop 1683.2`. The first sample after wrapping reported audio at `0.014s`, `paused: false`, `ended: false`, and transcript `scrollTop 0`, confirming an immediate reset without a reverse scroll animation.
- Shadowing processing now uses one visual status only: a centered loader in the disabled bottom action. The duplicate visible `Đang chấm điểm...` transcript line and the bottom `Đang xử lý...` / `Đang chấm điểm...` labels are removed; the button keeps the accessible name `Đang chấm điểm` while loading.
- Browser verification recorded and submitted a real Shadowing attempt. During the API request, the loading button contained one loader and no visible text, the page contained zero processing labels, and the active transcript contained no processing paragraph. After completion, the loading state cleared and the normal `Bạn nói:` result remained visible with no console error.
- Play/pause remains functional, the controls hide after 2 seconds, a first surface tap reveals them, and a second surface tap hides them immediately.
- Production client build passes and the browser console reports no errors.

final result: passed

## 20. Video subtitle vocabulary detail sheet

**Source visual truth**

- Reference loading state: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-cfb424fc-409b-484a-91fa-148e4a7090b0.png` (`402 x 561px`).
- Target flow: `/dich-video`, open a READY translated video, then select an English word in a subtitle card.

**Implementation evidence**

- Stable loading capture: `C:\Users\DELL\AppData\Local\Temp\video-word-detail-loading-stable-qa.png` (`516 x 958px`).
- Completed detail capture: `C:\Users\DELL\AppData\Local\Temp\video-word-detail-qa.png` (`516 x 958px`).
- Browser viewport override: `418 x 776` CSS pixels; the in-app browser capture backend emitted `516 x 958px` images.
- The reference is a focused crop of the sheet while the implementation evidence includes the dimmed video background, so the comparison is based on the shared sheet region rather than absolute top offset.

**Full-view and focused comparison evidence**

- The loading state matches the reference hierarchy: rounded white bottom sheet, centered drag handle, sticky title row, circular close action, centered indigo spinner, bold loading label, and muted contextual helper copy.
- The completed state keeps the same sheet dimensions and adds the selected headword, pronunciation action, phonetic, part of speech, synonyms, Vietnamese meaning, definition, and bilingual example.
- A separate focused crop was not needed because the complete loading sheet region and all text remain legible in both source and implementation captures.

**Required fidelity surfaces**

- Fonts and typography: the existing application font stack, `18px` sheet title, compact loading copy, and clear detail hierarchy match the established lesson vocabulary sheet.
- Spacing and layout rhythm: the shared component preserves its `82dvh` stable height during loading and result states, `24px` top radius, sticky header, centered loader, and fixed close target.
- Colors and visual tokens: white surface, slate text, primary indigo actions, subtle separators, dim backdrop, and light-theme contrast follow the reference and existing product tokens.
- Image quality and asset fidelity: no custom imagery is required for this sheet; Lucide icons remain sharp at the tested mobile viewport.
- Copy and content: loading text matches the reference. The lookup request includes the selected word, full English subtitle sentence, and Vietnamese translation so the returned meaning is contextual.

**Comparison history**

1. The video transcript initially supported segment seeking only and had no vocabulary-detail interaction.
2. English subtitle tokens were converted into independent word buttons and connected to the existing lesson vocabulary lookup sheet without changing segment seeking.
3. Browser verification selected `compensate` and received the matching headword and contextual Vietnamese meaning; an uncached lookup showed the expected loading state before resolving successfully.
4. No actionable P0/P1/P2 visual or interaction differences remain for the requested scope.

**Interaction and technical checks**

- Opening a word pauses playback and opens the sheet immediately.
- Closing the sheet keeps the existing downward exit animation.
- Related-word lookups, pronunciation controls, retry handling, and stale-request protection remain wired through the shared component.
- Client production build, ESLint, TypeScript compilation, and all `68` backend tests pass.

### 20.1. Remove translated-status badges from recent videos

- Source state: Browser Comment 1 on `/dich-video` at a `355 x 602` viewport, targeting the violet `Đã dịch` pill in a recent-video card.
- Browser-rendered evidence: `C:\Users\DELL\AppData\Local\Temp\video-recent-without-translated-badge-qa.png` (`351 x 595px`), closely matching the annotated `355 x 602` viewport without density resampling.
- Implementation state: the status pill is removed from every recent-video card while thumbnail, duration, title, metadata, overflow menu, card spacing, and open-video behavior remain unchanged.
- Browser verification rendered two recent-video cards and found zero exact `Đã dịch` labels. The removed row collapses cleanly without leaving an empty gap or horizontal overflow.
- Fonts, colors, image crop, icons, and app-specific copy outside the requested badge are unchanged. No new image asset was required.
- Production client build, ESLint, and TypeScript compilation pass; browser console has no errors.

### 20.2. Correct recent-video durations

- Source state: Browser Comment 1 on `/dich-video` showed unrelated YouTube videos with the same `10:00` duration in both the thumbnail badge and metadata row.
- Root cause: when `yt-dlp` metadata failed, the backend stored the free-account limit (`600` seconds) as though it were the video's duration.
- Browser-rendered evidence: `C:\Users\DELL\AppData\Local\Temp\video-recent-duration-fixed-qa.png`.
- The fallback now reads YouTube's `lengthSeconds`; only when that is unavailable does a newly processed job infer duration from the transcript timestamps. Existing READY jobs whose duration equals a configured quota limit are repaired from YouTube metadata on the next jobs-list request.
- Browser verification confirmed `00:21` for `Video vs Image: Which ad actually CONVERTS?`, `01:01` for `$7M worth of Business Advice in 60 seconds`, `05:14` for `Why does Japan work so hard?`, and `08:27` for `Urgent Message For Facebook Advertisers!`.
- Thumbnail duration and metadata duration use the same corrected API field. The full recent list has no `10:00` fallback values and browser console has no errors.
- ESLint, TypeScript compilation, and all `70` test cases pass.

### 20.3. Align uploaded-video transcript cards with lesson cards

- Source state: the supplied active sentence reference and the recently approved lesson transcript styling.
- Scope: `/dich-video` in the `Tải video` flow; URL and uploaded-video playback share the same transcript renderer, so the visual state stays consistent across both modes.
- Active segments keep a subtle primary-tinted background but now use the neutral `gray-100` border and no outer shadow. Inactive segments use transparent backgrounds and borders so they visually inherit the transcript surface.
- Browser-computed styles confirm the active card has no shadow and a neutral border, the inactive card is fully transparent, and all `12` rendered cards keep the same `472px` width.
- Existing interaction remains intact: from a paused uploaded video at `50.4s`, selecting the second subtitle segment immediately sought to `5.15s`, changed the active segment, and resumed playback at `1x`.
- The production client build passes and the browser console reports no errors or warnings.

### 20.4. Keep uploaded-video word focus synchronized

- Scope: the translated transcript on `/dich-video`, verified against READY upload job `da8797ec-f794-4085-a4a5-2cafaafcfb1d` (`0728(2)`).
- Stored word timings are normalized for absolute or segment-relative timestamps and clamped into a monotonic sequence, while segments without word timestamps retain the existing duration-weighted fallback.
- The latest word whose start time has passed remains focused until the next word starts or the segment ends. Focus is therefore stable through short timestamp gaps and remains visible while paused.
- Browser evidence: `D:\Code\ShowdingEng\backend\output\design-qa\video-upload-word-focus.png`. The green focus moved between words during real playback, and the active word exposes `aria-current="true"` for deterministic accessibility and QA checks.
- Production client build and TypeScript compilation pass; browser console reports no errors or warnings.

final result: passed

## 13. Speaking response loader

**Source visual truth**

- User reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-b3110dc1-e617-4bbc-a458-bd7a656047a9.png` (`166 x 63px`).
- The reference establishes a simple three-dot waiting indicator. Per the request, the implementation intentionally changes the dots from black to white and places them inside the existing purple response bubble.

**Implementation evidence**

- Final browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-response-loader-final.png` (`1580 x 889px`).
- Focused source/implementation comparison: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-response-loader-comparison.png` (`744 x 190px`).
- CSS viewport: `1404 x 790`; browser capture: `1580 x 889px` at device pixel ratio `1.125`.
- State: development-only isolated preview of the exact production loader component on the dark speaking surface.

**Required fidelity surfaces**

- Icon: the reload spinner is replaced with the existing Lucide `Ellipsis` icon, matching the reference's three filled circular dots.
- Color: all three dots render pure white (`rgb(255, 255, 255)`) against the existing violet response bubble.
- Motion: the dots use the existing Tailwind pulse animation. The animation is disabled when the operating system requests reduced motion; the verification browser reports `prefers-reduced-motion: reduce`, confirming that accessibility fallback.
- Layout: the existing compact left-aligned response bubble footprint, rounded shape, and violet color are preserved.
- Semantics: the indicator exposes `role="status"` and the Vietnamese accessible label `Đang chờ phản hồi`; the decorative icon is hidden from assistive technology.

**Comparison findings**

1. The focused comparison confirms the requested three-dot silhouette and spacing are preserved.
2. The requested white color inversion is applied without introducing a custom raster asset or CSS-drawn icon.
3. No actionable P0/P1/P2 visual differences remain for the requested scope.

final result: passed

## 16. Speaking practice history

**Source visual truth**

- Reference mockup: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-daba6ee4-d6b0-4893-808f-016e60c69238.png` (`852 x 1856px`).
- Target route: `/luyen-noi/lich-su`, with the existing application theme, real speaking-session data, no bottom navigation, and a guaranteed back action to `/luyen-noi`.

**Implementation evidence**

- Initial in-app Browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-history-implementation-initial.png` (`463 x 862px`).
- Combined reference/implementation comparison: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-history-comparison.png` (`944 x 1045px`).
- The initial browser capture used the user's active dark theme. It exposed a stale running backend process before the new route was loaded; the exact process was restarted and the endpoint now resolves through the normal authentication/guest-identity guard instead of returning 404.

**Findings and fixes**

- P1: the first capture showed `Cannot GET /api/speaking/history` because the already-running `ts-node` process had not loaded the new controller. Restarting only that verified project process fixed the runtime registration.
- P1: the hero headline wrapped to two lines and the hero/list rows were taller than the reference. The hero was reduced to `128px`, the title was constrained to one line, and list media was reduced to `70 x 64px` with tighter row spacing.
- P2: the first score treatment was a static border. It now uses a real conic progress ring driven by the calculated score, with matching green/orange/rose states and a separate unscored state.
- P2: the back button originally depended on browser history. It now returns directly to `/luyen-noi`, so direct entry and refresh still produce the expected navigation.

**Required fidelity surfaces**

- Typography and layout: centered navy title, circular header controls, pastel hero, four equal stat cards, horizontally scrollable filter chips, compact history cards, and bottom practice tip follow the reference hierarchy.
- Assets: the hero uses a project-bound generated raster illustration based on the supplied visual; scenario rows reuse the product's existing speaking artwork. All visible icons come from the existing Lucide icon system.
- Data and interaction: totals, average score, speaking streak, unique topics, duration, spoken-turn count, timestamps, and score labels are calculated from real speaking sessions. Category chips and the high-score filter update the list locally.
- Theme behavior: light mode follows the reference palette; dark mode uses neutral surfaces, reduced hero brightness, dark cards, and accessible violet/green/orange accents.
- Empty, loading, and error states are implemented so the new route remains complete for new guest accounts and interrupted requests.

**Technical checks**

- Production client build passes (`vite build`, 1717 modules).
- Independent backend TypeScript compilation passes with `tsconfig.build.json`.
- Speaking service test suite passes (`6/6`), including history aggregation, score averaging, duration totals, streak, and unique-topic statistics.
- The restarted backend recognizes `GET /api/speaking/history`; unauthenticated access reaches the normal authorization response rather than a missing-route response.

final result: passed

## 14. Premium homepage feature cards

**Source visual truth**

- Browser Comment 1 on `/`: redesign the four `Dành cho bạn` cards to match the attached premium 3D reference while keeping the existing product routes.
- Pre-change browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\home-feature-cards-before.png` (`414 x 769px`).
- The attached target reference establishes the 2 x 2 layout, saturated blue/purple/teal/orange card families, right-aligned 3D subjects, left-aligned live copy, rounded corners, and white pill actions.

**Implementation evidence**

- Final browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\home-feature-cards-after.png` (`414 x 769px`).
- Full before/after comparison: `D:\Code\ShowdingEng\backend\output\design-qa\home-feature-cards-full-comparison.png` (`846 x 769px`).
- Focused section comparison: `D:\Code\ShowdingEng\backend\output\design-qa\home-feature-cards-comparison.png` (`846 x 390px`).
- CSS viewport: `418 x 776`; source and implementation captures use the same browser density and were placed side by side without resampling.
- State: `/`, dark theme, 2-column mobile grid. The focused comparison excludes the independently rotating hero and account header, so those unrelated state differences do not affect the judgment.

**Generated asset additions**

- `client/public/images/home/listening-card.webp`: cobalt listening scene with headphones, music notes, and waveform.
- `client/public/images/home/vocabulary-card.webp`: violet vocabulary scene with an open book and colorful learning tiles.
- `client/public/images/home/speaking-card.webp`: teal speaking scene with a studio microphone, speech bubble, and sound ripples.
- `client/public/images/home/video-translation-card.webp`: orange video scene with a clapperboard, play symbol, and film-strip accents.
- The four final project assets are real generated raster illustrations, resized to `760 x 560px`, optimized to WebP, and approximately `19-25 KB` each.

**Full-view and focused comparison evidence**

- The four cards now occupy the same responsive 2-column structure but use the reference's larger `185 x 154px` proportions, stronger visual hierarchy, `22px` radii, and topic-specific full-bleed artwork.
- Copy and white pill actions remain on the reserved dark left side of each illustration; the primary 3D object remains on the right and stays recognizable at the final mobile size.
- Browser inspection confirms all four images load completely at `760 x 560px`, all four cards have equal dimensions, and the document has zero horizontal overflow.
- The focused comparison shows the new cards are substantially closer to the attached reference without changing adjacent homepage sections.

**Required fidelity surfaces**

- Fonts and typography: the app's existing sans-serif family is preserved; `17px` extra-bold titles, compact `10px` supporting text, and `10px` bold CTA labels remain readable without clipping or awkward wrapping.
- Spacing and layout rhythm: the existing `16px` page gutter is preserved; cards use a consistent `12px` grid gap, `154px` height, `14px` internal padding, `22px` radius, and balanced two-row rhythm.
- Colors and visual tokens: the blue, violet, teal, and orange families match the reference art direction; white content and CTA surfaces preserve contrast on the dark homepage.
- Image quality and asset fidelity: all four visible illustrations are dedicated optimized raster assets generated for the measured card slot; there are no placeholders, CSS drawings, stretched crops, text artifacts, or visible compression halos.
- Copy and content: Vietnamese titles, concise learning outcomes, and action labels are live UI text; the existing destinations remain `/kham-pha`, `/tu-vung`, `/luyen-noi`, and `/dich-video`.

**Comparison history**

1. The pre-change cards used small centered illustrations with a bottom label strip and did not match the reference's full-bleed premium composition. This was the requested P1 fidelity gap.
2. Four coordinated 3D illustrations were generated, visually inspected, optimized, and integrated with live text and responsive link behavior.
3. The first browser pass found a P2 contrast mismatch: the global dark-theme `.bg-white` override rendered the CTA pills dark. The CTA surface was changed to an explicit `#ffffff` token.
4. The final browser comparison confirms white action pills, correct crops, equal card geometry, and no remaining actionable P0/P1/P2 mismatch.

**Interaction and technical checks**

- Clicking `Từ vựng: Học ngay` successfully opens `/tu-vung`, and browser back returns to `/` without a full-page navigation error.
- Production client build passes.
- Browser console reports no errors.
- `git diff --check` reports no whitespace errors; existing line-ending notices are informational only.

final result: passed

## 13. Home vocabulary discovery carousel

**Source visual truth**

- User attachment: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-ea24600f-5226-48db-9fb4-73207a52d2da.png` (`407 x 278px`).
- Target state: light theme, “Khám phá bộ từ vựng” directly below “Bài nghe nổi bật”, first three vocabulary covers visible in a horizontally scrollable row.

**Implementation evidence**

- Light full-view capture: `D:\Code\ShowdingEng\backend\design-qa-artifacts\home-vocabulary-light.png` (`414 x 769px`).
- Dark full-view capture: `D:\Code\ShowdingEng\backend\design-qa-artifacts\home-vocabulary-dark.png` (`414 x 769px`).
- Normalized focused implementation crop: `D:\Code\ShowdingEng\backend\design-qa-artifacts\home-vocabulary-light-crop.png` (`407 x 278px`).
- Side-by-side focused comparison, source left / implementation right: `D:\Code\ShowdingEng\backend\design-qa-artifacts\home-vocabulary-comparison.png` (`824 x 278px`).
- CSS viewport: `418 x 776`; browser-reported device pixel ratio: `1.125`. The implementation screenshot is emitted by the browser backend at `414 x 769px`; the focused comparison uses a direct `407 x 278px` crop without density resampling.
- State: vocabulary overview loaded, first carousel position, both light and dark themes verified.

**Full-view and focused comparison evidence**

- The new section sits immediately below the featured-listening carousel and before “Chủ đề phổ biến”.
- The focused side-by-side comparison confirms matching hierarchy, `120px` cover height, compact white metadata panel, `12px` radius, subtle shadow, title placement, word count, learned count, and a partially visible third card.
- The first three cards use the exact production cover assets for Common 1000, Basic Travel, and Daily Conversation. No placeholders or code-drawn artwork are used.
- Dark mode keeps the same geometry and artwork while switching the card, border, type, and page tokens to the existing application theme.

**Required fidelity surfaces**

- Fonts and typography: existing product sans-serif is retained; section title, “Xem tất cả”, one-line card titles, and compact metadata match the source hierarchy and do not shift card height.
- Spacing and layout rhythm: `16px` section inset, `12px` card gap, `132px` card width, `120px` cover, `76px` metadata area, `12px` radius, and stable initial scroll position reproduce the reference density.
- Colors and visual tokens: the light state uses the reference white/slate/indigo balance; dark mode uses the application’s neutral surfaces and existing indigo accent.
- Image quality and asset fidelity: all visible covers are optimized WebP assets with the correct topic, crop, scale, and sharpness; no stretching, halos, or fallback graphics are visible.
- Copy and content: “Khám phá bộ từ vựng”, “Xem tất cả”, vocabulary titles, live word counts, and learned counts are preserved.

**Comparison history**

1. The first implementation matched the card proportions but allowed the carousel to advance automatically, so the initial view could drift away from the three source cards. This was a P2 state-fidelity issue.
2. Automatic advancement was removed and the shared horizontal-scroll component received an opt-in `startAtBeginning` behavior for this carousel.
3. Card titles initially wrapped to two lines in the production build. They were tightened to a single-line `11px` treatment so the metadata rhythm matches the source.
4. Post-fix light and dark captures show no actionable P0/P1/P2 differences. The source browser-scrollbar strip and small capture-width difference are environmental rather than component drift.

**Interaction and technical checks**

- Horizontal browsing was exercised and the carousel reliably reopens at the first card.
- “Xem tất cả” navigates to `/tu-vung`; browser Back returns to `/`.
- Production client build passes.
- Browser console reports no errors in the final state.

final result: passed

## 8. Registration box sizes matched to login

**Source visual truth**

- Registration reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-3e26e479-87b2-4857-ba93-38bb58d741da.png` (`450 x 542px`).
- Login size reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-4e3be2df-b1d8-4c34-8bfc-ad9500b3484b.png` (`450 x 456px`).
- User requirement: registration inputs, primary CTA, and Google CTA must use the same box dimensions as their login equivalents.

**Implementation evidence**

- Rendered login reference: `D:\Code\ShowdingEng\backend\output\design-qa\login-box-reference.png` (`418 x 776px`).
- Rendered registration implementation: `D:\Code\ShowdingEng\backend\output\design-qa\register-box-matched.png` (`418 x 776px`).
- Same-viewport comparison, login on the left and registration on the right: `D:\Code\ShowdingEng\backend\output\design-qa\auth-box-size-comparison.jpg` (`836 x 776px`).
- CSS viewport: `418 x 776`; browser-reported device pixel ratio: `1.125`; screenshots were captured at `418 x 776px`, so no density resampling was applied.
- State: empty authentication forms, light authentication theme, no validation or loading state.

**Full-view and focused comparison evidence**

- Login inputs: approximately `369.78 x 51px`; all four registration inputs: approximately `369.78 x 51px`.
- Login primary CTA and registration primary CTA: approximately `369.78 x 50px`.
- Login Google CTA and registration Google CTA: approximately `369.78 x 50px`.
- All compared boxes use the same `9px` border radius. The same-viewport composite confirms the registration screen still fits without horizontal overflow or clipped controls.
- A separate focused crop was unnecessary because every affected box is clearly visible at 1:1 scale in the side-by-side `836 x 776px` comparison, and browser-computed dimensions provide exact evidence.

**Required fidelity surfaces**

- Fonts and typography: the existing route-specific input and Google-label font sizes remain unchanged; primary CTA labels remain `18px`. The request only changes box geometry.
- Spacing and layout rhythm: registration box heights now match login exactly while existing registration gaps, agreement row, and section margins remain unchanged.
- Colors and visual tokens: borders, backgrounds, blue-violet CTA treatment, radii, and shadows remain unchanged.
- Image quality and asset fidelity: the existing HiHiEnglish wordmark, Google icon, field icons, and CTA raster asset remain production assets and render sharply.
- Copy and content: all login and registration labels, placeholders, agreement copy, and footer links remain unchanged.

**Comparison history**

1. Registration inputs measured `45px`, while login inputs measured `51px`; registration primary and Google CTAs measured `46px`, while login equivalents measured `50px`. This was the requested P2 consistency mismatch.
2. Registration-specific height rules were updated to `51px` for inputs and `50px` for both CTA boxes.
3. Post-fix browser evidence confirms exact width, height, and radius parity for all requested boxes. No actionable P0/P1/P2 differences remain.

**Technical checks**

- Production client build passes.
- Browser console reports no errors in the verified registration state.
- Registration has no horizontal overflow at the verified viewport.
- No form submission or account data transmission occurred during QA.

final result: passed

## 7. Primary authentication button text — 18px

**Source visual truth**

- Login button crop: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-6946509b-cde5-42d7-8187-eee06585486d.png` (`437 x 98px`).
- Registration button crop: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-6e0a8e3f-9dca-4bd0-ba01-9a1d2cffd030.png` (`423 x 69px`).
- The user's quantitative requirement is the source of truth: both primary CTA labels must render at `18px`.

**Implementation evidence**

- Login screen: `D:\Code\ShowdingEng\backend\output\design-qa\login-18px.png` (`418 x 776px`).
- Registration screen: `D:\Code\ShowdingEng\backend\output\design-qa\register-18px.png` (`418 x 776px`).
- Focused login comparison, source on the left and implementation on the right: `D:\Code\ShowdingEng\backend\output\design-qa\login-button-comparison.png` (`855 x 98px`).
- Focused registration comparison, source on the left and implementation on the right: `D:\Code\ShowdingEng\backend\output\design-qa\register-button-comparison.png` (`841 x 69px`).
- CSS viewport: `418 x 776`; browser-reported device pixel ratio: `1.125`; capture output: `418 x 776px`, so no density resampling was applied.
- State: empty login and registration forms, light authentication theme, no loading or validation state.

**Full-view and focused comparison evidence**

- Browser computed styles confirm `.account-auth-primary` renders at `18px`, weight `600`, and line-height `27px` on both `/dang-nhap` and `/dang-ky`.
- The login CTA measures approximately `369.78 x 50px`; the registration CTA measures approximately `369.78 x 46px`. Existing geometry is intentionally preserved.
- Focused comparisons confirm the label remains centered and the existing blue-violet raster treatment, radius, shadow, and white foreground remain unchanged.

**Required fidelity surfaces**

- Fonts and typography: both primary CTA labels now use the requested `18px` size with the existing font family, `600` weight, and centered alignment.
- Spacing and layout rhythm: button dimensions, margins, radii, and surrounding form spacing are unchanged.
- Colors and visual tokens: the existing blue-violet background asset, white text, and shadow are unchanged.
- Image quality and asset fidelity: the production CTA raster asset remains in use and renders without visible distortion.
- Copy and content: “Đăng nhập” and “Đăng ký tài khoản” are unchanged.

**Comparison history**

1. The shared primary CTA rule rendered the login label at `20px`; registration already overrode it to `18px`.
2. The shared rule was changed to `18px`, aligning both routes without duplicating route-specific CSS.
3. Post-fix browser evidence confirms both CTA labels compute to exactly `18px`; no actionable P0/P1/P2 differences remain for the requested change.

**Technical checks**

- Production client build passes.
- Browser console reports no errors in the verified authentication states.
- Route navigation between registration and login was checked; no form submission or account data transmission occurred.

final result: passed

## 9. Vocabulary-set book-cover card

**Source visual truth**

- Browser Comment 1 additional attachment: the compact Oxford 5000 vocabulary card shown in the current conversation; the attachment renderer did not expose a local filesystem path.
- Displayed source reference: approximately `151 x 229px`, with a dark academic cover above a compact white metadata panel.
- Normalized HiHiEnglish cover asset derived from that visual direction: `D:\Code\ShowdingEng\backend\client\public\images\vocabulary\common-1000-cover.png` (`1319 x 1192px`).
- Target characteristics: narrow portrait card, `12px` radius, academic navy cover, oversized word-count hierarchy, title below the cover, and a small two-item statistics row.

**Implementation evidence**

- Full rendered vocabulary state: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-book-card-final.png` (`418 x 776px`).
- Focused final card crop: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-book-card-crop.png` (`146 x 220px`).
- Cover-to-card comparison, normalized cover on the left and final implementation on the right: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-book-card-comparison.png` (`304 x 220px`).
- CSS viewport: `418 x 776`; browser-reported device pixel ratio: `1.125`; screenshot output remained `418 x 776px`, so no density resampling was applied to the implementation capture.
- State: `/tu-vung`, dark theme, vocabulary overview loaded, zero learned words, horizontal discovery row at its initial position.

**Full-view and focused comparison evidence**

- The selected card measures `146 x 219.78px` with a `12px` radius, closely matching the narrow source proportions.
- The card now uses a distinct `132px` cover area and an `86px` metadata panel instead of the former icon-first dashboard card.
- The focused comparison confirms the HiHiEnglish wordmark, large “1000”, “TỪ THÔNG DỤNG”, title, word count, and learned count remain fully visible at thumbnail size.
- Other vocabulary sets use the same book-cover structure while retaining their existing topic color and icon. The horizontal browsing behavior remains unchanged.

**Required fidelity surfaces**

- Fonts and typography: the cover uses a real generated raster asset for the display lettering; metadata uses the existing product sans-serif at compact `12px/16px` sizing with two-line clamping.
- Spacing and layout rhythm: `146px` width, `132px` cover, `86px` metadata panel, `12px` radius, and compact statistics spacing reproduce the reference density without horizontal page overflow.
- Colors and visual tokens: the featured cover uses the requested academic navy and white treatment; the metadata panel adapts to the application's existing dark theme.
- Image quality and asset fidelity: the featured cover is a dedicated high-resolution raster asset rather than CSS or placeholder art. It loads at `1319 x 1192px` and renders sharply in the `146 x 132px` slot.
- Copy and content: the production set title, `1000` word count, A1 data, learned count, and opening behavior remain intact.

**Comparison history**

1. The previous card was a wide `168px` dashboard tile with a rounded icon, level pill, long description, and `22px` radius. This was the primary P1 mismatch against the supplied book-cover reference.
2. The first implementation introduced the correct cover-and-metadata structure, but the original portrait cover was cropped inside the landscape cover slot and partially hid the HiHiEnglish wordmark. This was a P2 image-fit issue.
3. The cover asset was recomposed specifically for the `146 x 132px` slot, removing the unused lower panel and keeping every cover element visible.
4. Post-fix visual evidence shows no actionable P0/P1/P2 differences for the requested card redesign.

**Interaction and technical checks**

- The featured card remains a semantic button with a descriptive accessible name.
- Clicking the card successfully opens the 1000-word set detail view.
- Production client build passes.
- Browser console reports no errors and the page has no horizontal overflow in the verified state.

final result: passed

## 10. Topic-specific vocabulary cover images

**Source visual truth**

- Browser Comment 1 on `/tu-vung`: each vocabulary topic should have a corresponding image instead of a generic color-and-icon cover.
- Pre-change rendered state: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-book-card-final.png` (`414 x 769px` capture). It shows the dedicated 1000-word cover beside generic fallback covers for Travel and Daily Conversation.
- Target art direction: retain the compact book-cover card structure from section 9 while giving each of the eight visible sets a distinct, instantly recognizable full-bleed illustration.

**Implementation evidence**

- Initial discovery-row state: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-topic-covers-final.png` (`414 x 769px`).
- Horizontally scrolled state covering Technology, Education, and Economics: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-topic-covers-later.png` (`414 x 769px`).
- Full before/after comparison: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-topic-covers-comparison.jpg` (`828 x 769px`).
- Focused discovery-row comparison: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-topic-covers-focused-comparison.jpg` (`828 x 290px`).
- CSS viewport: `418 x 776`; browser-reported device pixel ratio: `1.125`. Browser captures are `414 x 769px`; no density resampling was applied to either side of the comparison.
- State: `/tu-vung`, dark theme, authenticated vocabulary overview. Learned-count differences between source and implementation are dynamic user data and are not part of the requested visual change.

**Generated asset set**

- `common-1000-cover.webp`: existing HiHiEnglish academic cover, now optimized for delivery.
- `travel-basic-cover.webp`: airplane, world map, luggage, and route markers.
- `daily-conversation-cover.webp`: two people speaking with colorful speech bubbles.
- `office-work-cover.webp`: laptop, briefcase, documents, lamp, and checklist.
- `movies-entertainment-cover.webp`: clapperboard, film reel, popcorn, and cinema star.
- `technology-cover.webp`: processor, circuits, cloud, phone, and AI orb.
- `education-cover.webp`: open book, graduation cap, pencil, and globe.
- `economics-cover.webp`: coins, rising chart, globe, and growth arrow.
- All eight production assets are `584 x 528px` WebP files. The seven new images are approximately `21–35 KB` each.

**Full-view and focused comparison evidence**

- The focused comparison confirms that the Travel and Daily Conversation subjects replace the generic number/icon blocks without changing card size, metadata placement, or horizontal browsing behavior.
- The later-state capture confirms that Technology, Education, and Economics remain distinct and legible at the far end of the horizontal row.
- Browser inspection confirms all eight cover images are complete, each has a natural size of `584 x 528px`, and each renders at approximately `144.22 x 132px` inside its card.
- The page has zero horizontal document overflow; overflow remains intentionally contained within the discovery carousel.

**Required fidelity surfaces**

- Fonts and typography: metadata typography, title wrapping, weights, and statistics labels are unchanged; no generated image contains unintended text.
- Spacing and layout rhythm: the existing `146px` card width, `132px` cover area, `86px` metadata panel, radius, and section spacing remain unchanged.
- Colors and visual tokens: every illustration uses the existing dark product palette with a topic-specific accent family; the black metadata panel continues to provide consistent contrast.
- Image quality and asset fidelity: all topic visuals are dedicated raster assets, share one polished 3D editorial language, use a source aspect ratio that exactly matches the cover slot, and render without stretching, halos, or soft thumbnail crops.
- Copy and content: production topic names, word counts, CEFR levels, learned counts, and set-opening behavior remain unchanged.

**Comparison history**

1. The pre-change UI used a dedicated raster cover only for `1000 Từ thông dụng`; the other visible sets used generic solid-color icon/number panels. This was the requested P1 content-fidelity gap.
2. Seven topic-specific illustrations were generated, visually inspected, resized to `584 x 528px`, and optimized to WebP before integration.
3. Post-fix source/implementation comparison shows the new artwork fits the existing card structure with no actionable P0/P1/P2 mismatch. No additional visual correction loop was required.

**Interaction and technical checks**

- Clicking `Du lịch cơ bản` successfully opens its 150-word detail view.
- Production client build passes.
- Browser console reports no errors.
- All eight mapped images load successfully, and the fallback cover remains available for future unmapped sets.

final result: passed

## 11. Topic thumbnails in “Bộ từ của bạn”

**Source visual truth**

- Browser Comment 1 on `/tu-vung`: saved vocabulary-set rows should display the corresponding topic image.
- Pre-change browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-topic-covers-final.png` (`414 x 769px`). The saved rows use generic topic icons even though matching covers already exist above.
- Scope is limited to the leading visual in each saved-set row; card geometry, labels, statistics, and navigation remain unchanged.

**Implementation evidence**

- Post-change browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-my-sets-topic-images-final.png` (`414 x 769px`).
- Full before/after comparison: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-my-sets-topic-images-comparison.jpg` (`828 x 769px`).
- Focused saved-row comparison: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-my-sets-topic-images-focused-comparison.jpg` (`828 x 335px`).
- CSS viewport: `418 x 776`; browser capture output: `414 x 769px`; both sides use the same capture density and require no resampling.
- State: `/tu-vung`, dark theme, authenticated overview with Travel, Technology, and Office Work saved.

**Full-view and focused comparison evidence**

- Travel, Technology, and Office Work now show their matching generated cover artwork in the existing `44 x 44px` leading slot.
- Browser inspection confirms all three thumbnails load completely from their mapped WebP files, each with a natural size of `584 x 528px` and a rendered size of `44 x 44px`.
- The fallback icon remains available for future saved sets that do not have a mapped cover.
- The card row size, text alignment, chevron position, and vertical rhythm are visually unchanged.

**Required fidelity surfaces**

- Fonts and typography: titles, counts, CEFR labels, learned-count copy, font weights, and truncation are unchanged.
- Spacing and layout rhythm: the original `44px` visual slot, `16px` card padding, row gaps, radius, shadow, and alignment are preserved.
- Colors and visual tokens: existing card and text tokens remain unchanged; each thumbnail inherits its topic palette from the generated cover.
- Image quality and asset fidelity: thumbnails use the real topic assets with centered `object-cover` cropping and render without distortion, blank space, or visible compression artifacts.
- Copy and content: all saved-set names, word counts, CEFR levels, learned counts, and navigation behavior remain intact.

**Comparison history**

1. The pre-change saved-set rows used generic Lucide icons instead of the already available topic cover artwork. This was the requested P1 content-fidelity gap.
2. The shared slug-to-cover mapping was reused for saved rows, with the existing icon retained only as a fallback.
3. Post-change visual comparison shows no actionable P0/P1/P2 differences for the requested scope.

**Interaction and technical checks**

- Clicking the saved `Du lịch cơ bản` row successfully opens its personal progress/detail view.
- Production client build passes.
- Browser console reports no errors, and the page has zero horizontal document overflow.

final result: passed

## 19. Video translation landing-screen redesign

**Source visual truth**

- Reference mockup: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-a2dc8322-0484-41d9-a18f-531038002a7d.png`.
- Target state: `/dich-video`, light theme, Link video selected, recent translated video visible.

**Implementation evidence**

- The reference and browser-rendered implementation were normalized to the same mobile app width and compared side by side.
- A dedicated generated raster asset is used for the purple 3D clapperboard hero artwork.
- The existing URL submission, file upload, quota, processing, recent-job open, and recent-job delete flows remain connected to their production API handlers.

**Required fidelity surfaces**

- Header, segmented mode control, lavender hero, feature row, inline link form, recent-video card, tip panel, and page-specific bottom navigation follow the reference hierarchy.
- Typography remains within the existing product font stack while matching the reference's navy headings, compact support copy, and violet actions.
- The page has no horizontal overflow, the upload tab and recent-video menu are interactive, and the browser console reports no errors.
- The production client build completes successfully.

final result: passed

## 17. Remove the CEFR badge from speaking-history rows

**Source visual truth**

- User-annotated browser state: `/luyen-noi/lich-su`, dark theme, `510 x 784` CSS viewport, with the `A2` badge shown after the `Hằng ngày` category badge.
- Pre-change browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-history-level-badge-before.png` (`507 x 778px`).

**Implementation evidence**

- Final browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-history-level-badge-after.png` (`507 x 778px`).
- Full-view comparison: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-history-level-badge-comparison.png` (`1034 x 778px`).
- Focused first-row comparison: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-history-level-badge-focused-comparison.png` (`982 x 130px`).
- Browser viewport: `510 x 784` CSS pixels at device pixel ratio `1.125`; before and after captures use identical dimensions and state.

**Required fidelity surfaces**

- Fonts and typography: the scenario title, category badge, timestamps, duration, turn count, score, and score label retain their existing sizes, weights, and line heights.
- Spacing and layout rhythm: removing the level badge lets the title row use the freed horizontal space without changing the card grid, image slot, score ring, padding, radius, or vertical rhythm.
- Colors and visual tokens: the dark card surface and the existing fuchsia category badge remain unchanged; only the indigo CEFR badge is removed.
- Image quality and asset fidelity: scenario artwork, crop, sharpness, and sizing are unchanged.
- Copy and content: the `A2` label is absent from every rendered history row, while the scenario title and category label remain visible.

**Comparison history**

1. The source state included a redundant `A2` pill next to the category pill on each history card.
2. The CEFR pill was removed from the shared history-row renderer.
3. The post-change DOM contains 15 history rows and no visible `A2` text; the focused comparison shows no unintended movement outside the title-row content.

**Interaction and technical checks**

- History data reloads successfully and all 15 rows render.
- Browser console reports no warnings or errors.
- Production client build and backend TypeScript compilation pass.

final result: passed

## 13. Scenario-specific artwork and colors for 50 speaking lessons

**Source visual truth**

- The content catalog in `src/speaking/speaking-scenarios.ts` defines 50 new level-specific speaking lessons: 10 each for A1, A2, B1, B2, and C1.
- Each lesson supplies a scenario slug, title, description, category, and color token. These fields are the source of truth for selecting both the illustration and the card palette.

**Implementation evidence**

- Contact sheet: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-50-scenario-images-contact-sheet.png`.
- A2 browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-new-images-a2-scroll.png`.
- Final asset directory: `D:\Code\ShowdingEng\backend\client\public\images\speaking\scenarios`.
- All 50 assets are optimized `640 x 480px` WebP illustrations, grouped evenly across the five CEFR levels and totaling approximately 1.73 MB.

**Required fidelity surfaces**

- Scenario relevance: every lesson has a distinct illustration that depicts its own conversational setting, including classroom greetings, transport, shopping, healthcare, workplace presentations, negotiations, public speaking, and advanced policy discussions.
- Visual consistency: all assets use a premium soft 3D clay-render style, clear central composition, safe card padding, and no readable text, logos, watermarks, borders, or embedded interface controls.
- Colors: `SpeakingPage.tsx` maps backend color tokens to matching tint and accent pairs. Light mode uses the scenario tint on card surfaces; dark mode preserves the dark surface while retaining the assigned accent color and scenario-specific artwork.
- Image quality: the 4:3 images use `object-cover` without stretching and remain recognizable at the compact mobile card size.

**Interaction and technical checks**

- All 50 public image URLs return HTTP 200.
- Browser inspection confirms all 10 A2 and all 10 C1 generated images load completely with a natural size of `640 x 480px`.
- Expanding the scenario list and changing CEFR levels continue to work without horizontal overflow.
- Production client build passes, and `git diff --check` reports no whitespace errors.

final result: passed

## 15. Speaking selection redesign and level-specific scenario catalog

**Source visual truth**

- Reference mockup: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-ed4b66bb-c25e-4a36-b9c2-875533ee7f8c.png` (`863 x 1822px`).
- Target state: `/luyen-noi`, light theme, A1 selected, all categories selected, six scenario cards visible.
- The reference was normalized to `507 x 1080px` so its pixel dimensions match the browser-rendered implementation capture.

**Implementation evidence**

- Browser-rendered implementation: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-redesign-after-507x1080-final.png` (`507 x 1080px`).
- Normalized reference: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-redesign-reference-507x1080.png` (`507 x 1080px`).
- Full side-by-side comparison: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-redesign-comparison-507x1080-final.png` (`1038 x 1080px`).
- Focused scenario-grid comparison: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-redesign-focused-cards-final.png` (`1038 x 570px`).
- Browser CSS viewport: approximately `460 x 972`; output capture: `507 x 1080px`. The source was resampled directly to the output capture dimensions to remove density mismatch.

**Findings**

- No actionable P0/P1/P2 differences remain.
- The generated hero preserves the source subject, pose, microphone, headset, palette, and right-aligned composition. The source-only speech bubble and status bar are intentionally omitted because the page runs inside the existing product shell; this is acceptable P3 drift.
- The implementation keeps the product's persistent bottom navigation, which is absent from the standalone mockup but required for consistency with the rest of the application.
- Scenario titles and descriptions use production catalog copy rather than the illustrative text in the mockup; hierarchy, card density, and interaction affordances remain faithful.

**Required fidelity surfaces**

- Fonts and typography: the implementation matches the bold navy hierarchy, compact level labels, readable two-line card titles, small supporting copy, and truncation behavior. No broken wrapping or clipped display text was found.
- Spacing and layout rhythm: hero proportions, rounded white content sheet, five-column level selector, five filter chips, three-column card grid, section gaps, radii, and shadows closely follow the reference. The document has no horizontal overflow.
- Colors and visual tokens: the pale lavender hero, navy foreground, level accents, violet selected states, pastel card tints, and soft borders map consistently to the source palette.
- Image quality and asset fidelity: the page uses generated raster artwork for the hero, six scenario families, and trophy tip card. Crops fit their slots without stretching, transparency halos, or placeholder graphics.
- Copy and content: Vietnamese labels, CEFR levels, category filters, scenario descriptions, time labels, roles, and actions are complete. The backend catalog now contains 50 new level-specific scenarios: exactly 10 each for A1, A2, B1, B2, and C1.

**Comparison history**

1. Initial full-view comparison used a shorter default browser viewport and made the scenario grid appear less dense than the reference; this was a normalization mismatch rather than a layout defect.
2. The implementation was recaptured at a source-equivalent aspect ratio, the source was normalized to the same `507 x 1080px`, and the level selector was aligned to the A1/collapsed state.
3. Changing CEFR level previously retained the expanded “Xem tất cả” state. The level interaction was updated to collapse the list, then recaptured. The post-fix comparison shows no remaining P0/P1/P2 issue.

**Interaction and technical checks**

- API returns 60 scenarios total: the 10 existing scenarios plus 50 new scenarios.
- Automated catalog tests verify exactly 10 new scenarios for every requested level and unique slugs/sort orders (`11/11` tests passed across the speaking suites).
- Browser check on A2 showed 10 `a2-` scenarios in the expanded list; browser check on C1 showed 10 `c1-` scenarios, including the final four catalog entries.
- The Học tập filter correctly reduced A2 to its matching study scenario, and switching level now resets the expanded list.
- Production client build and independent backend TypeScript compilation pass. The browser console reports no warnings or errors.
- The page has no horizontal overflow at the tested mobile viewport.

final result: passed

## 12. Topic thumbnails in “Tất cả bộ từ vựng”

**Source visual truth**

- Browser Comment 1 on the all-set view: every vocabulary-set row should load its corresponding topic image.
- Top pre-change capture: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-all-sets-topic-images-before-top.png` (`414 x 769px`).
- Bottom pre-change capture: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-all-sets-topic-images-before.png` (`414 x 769px`).
- The source state uses generic icons in the `48 x 48px` leading visual slot. The requested change is limited to replacing that visual with topic artwork.

**Implementation evidence**

- Top final capture: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-all-sets-topic-images-final-top.png` (`414 x 769px`).
- Bottom final capture: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-all-sets-topic-images-final-bottom.png` (`414 x 769px`).
- Top before/after comparison: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-all-sets-topic-images-top-comparison.jpg` (`828 x 769px`).
- Bottom before/after comparison: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-all-sets-topic-images-bottom-comparison.jpg` (`828 x 769px`).
- Focused top-card comparison: `D:\Code\ShowdingEng\backend\output\design-qa\vocabulary-all-sets-topic-images-focused-comparison.jpg` (`828 x 500px`).
- CSS viewport: `418 x 776`; source and implementation captures are `414 x 769px` at the same browser density, so no density resampling was required.
- State: `/tu-vung`, dark theme, “Tất cả bộ từ vựng” open, empty search query.

**Generated asset additions**

- `business-cover.webp`: business partners, handshake, briefcase, presentation board, and growth motif.
- `banking-cover.webp`: classical bank, secure vault, blank payment card, and protection shield.
- `finance-cover.webp`: balanced scale, pie chart, neutral coins, blank calculator, and trend motif.
- The built-in image-generation path produced the raster sources. Each final project asset was resized to `584 x 528px` and optimized to WebP at approximately `22–30 KB`.

**Full-view and focused comparison evidence**

- All 11 rows now show the image mapped to the row’s slug, including the newly covered Business, Banking, and Finance sets.
- Browser inspection confirms 11/11 images load completely, each with a natural size of `584 x 528px` and a rendered size of `48 x 48px`.
- The focused comparison confirms the image replacement does not shift titles, CEFR pills, descriptions, metadata, or chevrons.
- The bottom comparison confirms the three newly generated covers remain distinct and recognizable at thumbnail size.

## 18. Speaking-session summary redesign

**Source visual truth**

- User reference: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-91320086-b145-4b0c-930a-d990d1081511.png` (`1023 x 1537px`).
- Requested adaptation: preserve the dark navy celebration layout, overall score card, three skill cards, and action hierarchy while omitting the entire `Nhận xét của AI` section.

**Implementation evidence**

- Final browser capture: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-summary-final.png` (`1600 x 900px`), with the production summary component rendered in a `512px` mobile column.
- Source/implementation comparison: `D:\Code\ShowdingEng\backend\output\design-qa\speaking-summary-comparison.png` (`1995 x 1200px`).
- The comparison normalizes the source from `1023px` to `512px` wide next to the implementation at the same `512px` CSS width; no density-based judgment is made from the surrounding QA canvas.
- State: completed `Nhà hàng` A2 session, overall `86`, fluency `94`, grammar `80`, vocabulary `70`, and one completed speaking turn.

**Full-view and focused comparison evidence**

- The combined comparison is both the full-view and focused evidence: both `512px` columns retain readable score typography, labels, artwork, card boundaries, and action copy without downscaling below the mobile target width.
- A separate focused crop was not required because all critical typography and iconography remain legible in the normalized side-by-side capture.

**Required fidelity surfaces**

- Fonts and typography: the implementation preserves the bold centered title, large `86/100` hierarchy, compact skill scores, Vietnamese labels, and strong action-button typography using the application's existing font stack.
- Spacing and layout rhythm: the header, hero score card, three equal skill cards, primary action, and paired secondary actions follow the reference order and compact mobile rhythm. Removing the AI feedback card intentionally brings the action group directly below the skill cards.
- Colors and visual tokens: the dark navy surface, indigo/violet score card, emerald/sky/violet metric accents, white text, muted slate copy, and violet-to-blue primary action match the source palette.
- Image quality and asset fidelity: `client/public/images/speaking/summary-hero.png` is a dedicated generated 3D raster asset with the celebratory headset character, circular indigo glow, stars, and embedded `Great job!` bubble. It is not recreated with CSS or inline SVG.
- Copy and content: the title, scenario/level line, score labels, turn count, and three action labels match the requested screen. `Nhận xét của AI` and all of its child content are absent from the rendered DOM.

**Comparison history**

1. First pass: the hero and metric cards were materially taller than the reference, and the vocabulary score `70` was labeled `Tốt` instead of `Khá` (P2).
2. Fix: the hero was reduced from `292px` to `240px`, metric cards from `142px` to `118px`, action heights were tightened, and score-label thresholds were aligned to the reference.
3. Second pass: the generated `Great job!` bubble was clipped by centered `object-cover` cropping (P2).
4. Fix: the asset was regenerated with a smaller embedded bubble and the hero crop was anchored to the top. The final comparison shows the bubble, face, headset, thumb, score, and progress row without clipping.

**Interaction and technical checks**

- The summary exposes exactly three enabled next-step actions: choose another scenario, retry the same scenario, and return home.
- The production screen wires the back and choose-another actions to session reset, retry to a new session for the completed scenario, and home to `/`.
- Browser console reports no warnings or errors, and the final DOM does not contain `Nhận xét của AI`.

final result: passed

**Required fidelity surfaces**

- Fonts and typography: the existing title, CEFR, description, and metadata typography, line clamping, weights, and hierarchy remain unchanged.
- Spacing and layout rhythm: the original `48px` leading slot, `16px` card padding, `12px` card gap, row height, radius, and sticky header are preserved.
- Colors and visual tokens: existing card, text, search, and navigation tokens are unchanged; topic palettes now come from the corresponding artwork.
- Image quality and asset fidelity: all topic visuals are real optimized raster assets with centered `object-cover` cropping; no stretched images, blank spaces, or visible compression artifacts were found.
- Copy and content: all 11 titles, CEFR levels, descriptions, word counts, learned counts, and navigation behavior remain unchanged.

**Comparison history**

1. The pre-change all-set view used generic Lucide icons for every row. This was the requested P1 content-fidelity gap.
2. The existing eight covers were reused, and three matching covers were generated for Business, Banking, and Finance so the entire 11-set catalog is covered.
3. Post-change top, bottom, and focused comparisons show no actionable P0/P1/P2 differences for the requested scope.

**Interaction and technical checks**

- Search filtering was checked with “Kinh doanh” and returned matching catalog rows.
- Clicking `1000 Từ thông dụng` successfully opens its detail view.
- Production client build passes.
- Browser console reports no errors, and the page has zero horizontal document overflow.

final result: passed

## Từ vựng cá nhân — 25/10/2026

**Phạm vi**

- Ba giao diện đã chốt: sổ từ, popup chi tiết và ôn tập flashcard.
- Lưu từ trong bài học Khám phá, luyện tập, video của kênh và podcast/video cá nhân.
- Lọc Đã nhớ, ôn theo danh sách đang lọc, ôn một từ và Ôn tất cả.

**Nguồn thiết kế**

- `C:/Users/DELL/.codex/generated_images/01a17268-cd28-70a3-aea4-520e1da135bb/exec-fc8f98e4-3770-4bc4-bdf7-9c521107046f.png`
- `C:/Users/DELL/.codex/generated_images/01a17268-cd28-70a3-aea4-520e1da135bb/exec-d48934eb-3f8e-4ca6-b486-b3f41ddd88b8.png`
- `C:/Users/DELL/.codex/generated_images/01a17268-cd28-70a3-aea4-520e1da135bb/exec-06edb88c-354a-4cf6-8848-c6f1ac60ac3a.png`

**Bằng chứng trình duyệt**

- `design-qa-evidence/vocabulary-library.png`
- `design-qa-evidence/vocabulary-detail.png`
- `design-qa-evidence/vocabulary-review.png`
- Đối chiếu đầy đủ: `vocabulary-library-comparison.png`, `vocabulary-detail-comparison.png`, `vocabulary-review-comparison.png` trong cùng thư mục.
- Ảnh tổng hợp: `design-qa-evidence/vocabulary-implemented.png`.
- Lưu từ thật: `design-qa-evidence/vocabulary-save-from-lesson.png` và `design-qa-evidence/vocabulary-save-from-podcast.png`.

**Kích thước và trạng thái**

- Thiết kế gốc: 853 × 1844 pixels, viewport thiết kế 390 × 844.
- Viewport DOM thực tế khi chụp: 480 × 1038 CSS pixels; `scrollWidth=480`, không có overflow ngang. Trình duyệt trong ứng dụng nhân đôi kích thước yêu cầu viewport.
- Ảnh raw 960 × 2076 có vùng trắng thừa ở bên phải/dưới. Ảnh kiểm tra cắt đúng vùng nội dung 480 × 1038 ở góc trên trái, không chỉnh hay kéo giãn nội dung ứng dụng. Nguồn thiết kế được chuẩn hóa riêng về 480 × 1038 để đối chiếu cùng tỉ lệ.
- Màn danh sách: đã đăng nhập tài khoản QA, lọc Đã nhớ. Màn chi tiết và ôn tập: từ consistent, đã nhớ, đã mở đáp án.
- Số lượng từ, tên bài, câu ví dụ và tổng lượt ôn dùng dữ liệu thật của tài khoản QA. Nguồn câu là bài học thực; không thay câu gốc bằng nội dung mẫu của ảnh thiết kế. Ảnh ôn là phiên một từ từ popup, cùng thành phần với phiên lọc Đã nhớ.

**Đối chiếu năm bề mặt**

- Typography: dùng Inter hiện có, tiêu đề và từ khóa nổi bật, body và nút đọc rõ, không dùng chữ trong ảnh để thay UI.
- Spacing/layout: thứ tự nội dung, nhóm thống kê, ôn toàn bộ, lọc, danh sách, popup và flashcard đúng cấu trúc đã duyệt. Nút chính và thanh điều hướng không bị che ở viewport kiểm tra.
- Colors/tokens: nền gần đen, bề mặt charcoal, primary `#6366f1`, nhãn Đã nhớ xanh và Cần ôn vàng. Nút dùng token thương hiệu hiện có; không tái tạo texture/gradient do bộ tạo ảnh thêm vào mock.
- Image quality: dùng logo sẵn có và icon Lucide; không thêm ảnh minh họa ngoài yêu cầu.
- Copy/content: phân biệt rõ Ôn tất cả và Ôn lại danh sách đang lọc. Chi tiết cho phép ôn ngay, câu nguồn giữ nguyên. Flashcard ẩn đáp án trước khi yêu cầu xem, rồi mới cho tự đánh giá.

**Kiểm tra tương tác**

- Đăng nhập tài khoản QA riêng, tải sổ từ, lọc Đã nhớ, mở popup, bắt đầu ôn một từ và mở đáp án.
- Nghe lại mở `/bai-hoc/lesson-150?t=46.24&end=52.6`; media phát từ đoạn đã lưu và dừng ở cuối đoạn. Đã thêm clamp về chính xác `end`.
- Tra và lưu experience từ bài học Khám phá; tra và lưu morning từ podcast QA. Cả hai chuyển nút sang Đã lưu từ vựng.
- Kiểm tra API thật với hai tài khoản: chống lưu trùng, nguồn gốc câu, phiên ôn Đã nhớ chưa đến hạn, Ôn tất cả, cách ly tài khoản, chặn truy cập/bỏ lưu/ôn nguồn của người khác, retry cùng request và từ chối tiến độ cũ.
- 117 kiểm thử backend, 78 kiểm thử bài nghe/Từ vựng, 17 kiểm thử video: passed. TypeScript backend và `typecheck:listening`: passed. Build Vite: passed.
- Console trong các màn sổ từ/chi tiết/ôn tập không ghi nhận lỗi ứng dụng. Một lần fixture podcast thiếu URL audio đã được sửa trong dữ liệu QA trước khi kiểm tra lưu từ.
- TypeScript toàn client còn 6 lỗi ngoài phạm vi: ExplorePage (2 unused), HistoryPage (2 unused), ProfilePage (1 unused), SpeakingHistoryPage (thiếu SpeakingCategory). Chi tiết ở `docs/saved-vocabulary.md`.

**Lịch sử đối chiếu**

- Chuẩn hóa vùng trắng thừa của công cụ chụp trước khi đánh giá, không coi đây là lỗi giao diện.
- Đối chiếu cả ba ảnh và kiểm tra trực tiếp chữ, nhãn, nguồn nghe và nút hành động. Không có P0/P1/P2 về bố cục hoặc tương tác còn tồn tại trong phạm vi này.
- P3: độ sáng nút khác nhẹ raster mock vì dùng token màu thương hiệu thực tế. Các dòng câu dài tự giãn theo dữ liệu nguồn.

**final result: passed**

Tài khoản và dữ liệu QA đã được dọn bằng ID riêng sau kiểm thử; dữ liệu tài khoản thật không bị xóa.

## Tinh gọn chi tiết và ôn tập từ vựng — 25/10/2026

- Theo bốn ảnh người dùng cung cấp: bỏ nút “Nghe lại trong podcast”, khung nguồn có tên podcast và “Nghe câu gốc · thời gian”, dòng định nghĩa phụ, và câu “Bạn có thể ôn lại từ này bất cứ lúc nào”.
- Khung nguồn được bỏ ở cả popup chi tiết và flashcard. Đã dọn component, callback và CSS không còn dùng.
- Giữ nghĩa chính, câu gốc, bản dịch, nút phát âm, ôn tập và bỏ lưu.
- Kiểm tra DOM thực tế: popup từ `new` và flashcard không còn các mục đã đánh dấu.
- Bằng chứng: `design-qa-evidence/vocabulary-detail-trimmed.png` và `design-qa-evidence/vocabulary-review-trimmed-raw.png`.
- Typecheck bài nghe và 78 kiểm thử frontend hiện có: passed. Build Vite: passed.
- Không còn P0/P1/P2 về bố cục trong thay đổi này.

final result: passed

## Thiết kế lại mặt trước flashcard theo ảnh 2 — 25/10/2026

**Nguồn và phạm vi**

- Ảnh đích: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-da08d0e9-a68a-4129-9fbe-f131f46dbaa6.png` (405 × 430). Vùng thẻ gốc: x=14, y=12, 372 × 398.
- Chỉnh thẻ cao và thoáng hơn, nền tối xanh, viền slate, chữ và nút phát âm lớn hơn. Bỏ gợi ý và đường chia ở mặt trước; chuyển “Xem đáp án” ra dưới thẻ để giữ luồng ôn tập.

**Bằng chứng và chuẩn hóa**

- Ảnh trang: `design-qa-evidence/vocabulary-card-redesign-page.png`.
- Ảnh thẻ: `design-qa-evidence/vocabulary-card-redesign.png`.
- Đối chiếu hai ảnh: `design-qa-evidence/vocabulary-card-redesign-comparison.png`.
- Thẻ thực tế: x=17.99, y=183.42, 420.27 × 449.63 CSS pixels. Không tràn ngang. Nút mở đáp án nằm dưới thẻ tại y=649.04.
- Cắt vùng trắng thừa của ảnh công cụ, lưu riêng ảnh raw và bounds. Chuẩn hóa ảnh thẻ thực tế về 372 × 398 để đối chiếu cùng tỉ lệ; không chỉnh nội dung ảnh chụp.

**Đối chiếu năm bề mặt**

- Typography: từ khóa, IPA và từ loại có kích thước và thứ bậc tương ứng ảnh 2; nhãn và chú thích đọc rõ.
- Spacing/layout: tỉ lệ thẻ 372/398, nhãn ở hai góc trên, nội dung giữa và khoảng trống dưới tương ứng ảnh đích. Nút mở đáp án nằm ngoài thẻ theo quyết định triển khai.
- Colors/tokens: nền `#101417`, viền `#29323a`, chữ phụ xanh xám, nhãn cần ôn vàng nâu. P3: dùng nền CSS phẳng nên khác nhẹ texture mờ trong ảnh đích.
- Image quality: icon Lucide sắc nét, chữ là văn bản thật; không dùng raster thay giao diện.
- Copy/content: giữ từ thật `new`, IPA, từ loại và phát âm; bỏ hoàn toàn câu gợi ý trong ảnh 1.

**Kiểm tra và kết quả**

- Trình duyệt thực: mặt trước đúng bố cục, bấm “Xem đáp án” hiện nghĩa và câu ví dụ, xuất hiện hai nút tự đánh giá. Không gửi đánh giá hoặc thay đổi tiến độ của từ thật.
- `typecheck:listening`: passed; 78 kiểm thử frontend trong 8 suites: passed. Build Vite sau căn chỉnh cuối: passed. Cảnh báo bundle lớn có sẵn.
- Không còn P0/P1/P2 về bố cục hoặc thao tác trong phạm vi thay đổi này.

final result: passed

## Flashcard lật hai mặt — 25/10/2026

**Nguồn và phạm vi**

- Ảnh đích mặt sau: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-c7a3051c-fc18-4f72-9b65-7a99d765d637.png` (397 × 515), vùng thẻ x=14, y=10, 370 × 484.
- Mặt trước tiếp tục dùng thiết kế đã chốt ở lượt trước. Thay nút mở đáp án bằng vùng bấm phủ toàn bộ thẻ. Có hiệu ứng lật 3D hai chiều, hỗ trợ Enter/Space và tắt chuyển động khi người dùng chọn giảm chuyển động.
- Mặt sau gồm phần từ/phát âm thu gọn, nghĩa trong nền tím, câu ví dụ và bản dịch trong một khung, nút nghe ví dụ, hai nút tự đánh giá bên trong thẻ.

**Bằng chứng và chuẩn hóa**

- Mặt trước: `design-qa-evidence/vocabulary-flip-front.png`.
- Mặt sau cuối: `design-qa-evidence/vocabulary-flip-back-final.png`.
- Đối chiếu trước căn chỉnh: `design-qa-evidence/vocabulary-flip-comparison-01.png`.
- Đối chiếu cuối: `design-qa-evidence/vocabulary-flip-comparison-final.png`.
- Viewport thực tế 456 × 773 CSS pixels. Mặt trước 420.27 × 449.63; mặt sau cuối 420.27 × 546.76 tại x=17.99, y=183.42. Không tràn ngang; hai nút đánh giá hiển thị đủ trong viewport.
- Ảnh raw có vùng trắng thừa của công cụ; ảnh kiểm tra cắt theo DOM bounds, lưu raw và bounds riêng. Ảnh thẻ cuối được thu về chiều rộng 370, giữ nguyên tỉ lệ, để so với ảnh nguồn 370 × 484. Kích thước chuẩn hóa khoảng 370 × 482.
- Toàn bộ thẻ đã đọc rõ trong ảnh đối chiếu; không cần ảnh phóng riêng từng vùng.

**Đối chiếu năm bề mặt**

- Typography: tiếp tục dùng font của ứng dụng. Cỡ chữ từ, IPA, từ loại, nhãn, nghĩa và câu ví dụ tương ứng ảnh mẫu, nghĩa được nhấn mạnh bằng chữ đậm.
- Spacing/layout: đúng thứ tự và nhóm nội dung của ảnh 2; nghĩa và ví dụ có khung riêng, đánh giá nằm trong thẻ. Các nút có vùng chạm tối thiểu 44px.
- Colors/tokens: nền tối xanh và viền slate giữ từ mặt trước; khung nghĩa tím, nút Chưa nhớ đỏ, nút Đã nhớ tím xanh. P3: nền CSS phẳng và sắc độ nút khác nhẹ texture/màu raster ảnh đích.
- Image quality: chữ là văn bản thật, biểu tượng từ thư viện Lucide hiện có, không dùng ảnh thay giao diện. Không có ảnh nội dung mới cần tạo.
- Copy/content: đúng các nhãn Nghĩa, Ví dụ và hai lựa chọn đánh giá. Câu gốc, bản dịch và nghĩa dùng từ đã lưu thật, có tô màu từ cần học và phát âm câu.

**Lịch sử đối chiếu**

- Lần 1: P2 — thẻ sau cao hơn ảnh mẫu khoảng 4%, các nhóm nghĩa/ví dụ/đánh giá bị đẩy xuống. Đã giảm khoảng đệm và khoảng cách giữa các nhóm.
- Lần 2: đối chiếu ảnh cuối cho thấy tỉ lệ thẻ và vị trí hai nút đã tương ứng ảnh mẫu. Không còn P0/P1/P2 trong phạm vi này.

**Kiểm tra tương tác**

- Trình duyệt thật: lật qua lại bằng vùng bấm của thẻ, Enter và Space. Kiểm tra DOM tại năm vị trí trên nền/chữ của thẻ: đều nhận đúng nút lật phủ thẻ.
- Nút phát âm từ và câu ví dụ hoạt động riêng, giữ nguyên mặt đang mở. Mặt ẩn có aria-hidden và inert; nút lật là button thật và giữ focus khi lật.
- Không cho lật hoặc gửi đánh giá thêm khi đang lưu; khi lỗi lưu vẫn giữ đáp án và retry cùng requestId. Các tình huống này được kiểm thử với API giả lập, không đánh giá từ thật của người dùng.
- Từ tiếp theo luôn bắt đầu ở mặt trước; ôn từ đã nhớ tiếp tục hoạt động.
- TypeScript phần bài nghe/Từ vựng: passed. 80 kiểm thử frontend trong 8 suites: passed. Build Vite cuối: passed, còn cảnh báo kích thước bundle có sẵn.
- Không ghi nhận lỗi console trong phiên kiểm tra flashcard. Lỗi tải lượt ôn ban đầu đã hết khi tải lại; sau đó đã kiểm tra trực tiếp trên phiên thật.

final result: passed

## Đồng bộ chế độ sáng/tối cho Từ vựng — 25/10/2026

- Nguyên nhân: VocabularyPage tự gắn class dark và stylesheet chỉ có bảng màu tối, trái với lựa chọn light ở ThemeProvider.
- Đã bỏ class dark cục bộ; giao diện dùng class dark trên document do ThemeProvider hiện có quản lý. Không tạo lựa chọn hoặc trạng thái theme riêng.
- Màu của sổ từ, thống kê, tìm kiếm, bộ lọc, popup, trạng thái rỗng/lỗi, màn hoàn thành và hai mặt flashcard dùng chung các biến màu với hai bảng sáng/tối. Giá trị màu tối giữ như thiết kế đã duyệt; chế độ sáng dùng nền sáng, chữ tối và nhãn có màu đủ rõ.
- Kiểm tra trình duyệt qua công tắc Chế độ tối trong trang Cá nhân: sổ từ, popup chi tiết, mặt trước và mặt sau flashcard đều theo đúng lựa chọn. Cuối phiên trang Từ vựng hiển thị light, khớp lựa chọn ban đầu. Không gửi đánh giá hoặc thay đổi từ đã lưu.
- Viewport 456 × 773 CSS pixels. Không tràn ngang. Ảnh raw được cắt vùng nội dung thật theo viewport, không chỉnh nội dung giao diện; bản đối chiếu chuẩn hóa mỗi trang về cùng kích thước.
- Bằng chứng: tám ảnh vocabulary-theme-{light,dark}-{library,detail,front,back}.png trong design-qa-evidence, kèm raw và metadata màu/kích thước.
- Đối chiếu đã xem: vocabulary-theme-library-comparison.png, vocabulary-theme-detail-comparison.png và vocabulary-theme-back-comparison.png trong cùng thư mục. Nhãn phiên ôn khác nhau do đi vào từ danh sách hoặc popup; cả hai dùng cùng thành phần flashcard.
- Bố cục, font, nội dung và biểu tượng giữ nguyên. Cả hai chế độ có đủ độ phân biệt giữa nền, đường viền, chữ chính, chữ phụ, nhãn và hành động. Không thêm tài nguyên ảnh.
- 80 kiểm thử frontend trong 8 suites và build Vite: passed. Không ghi nhận lỗi console trong phiên kiểm tra cuối. Cảnh báo bundle lớn có sẵn.
- Không còn P0/P1/P2 trong phạm vi đồng bộ giao diện này.

final result: passed

## Mặt sau rút gọn và đồng nhất kích thước — 25/10/2026

- Nguồn: mặt trước trong `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-a0f22ef7-3ba7-4caa-8ada-f93fdb10dd8d.png`; nội dung mặt sau trong `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-4c40602d-6be5-4ab7-a434-4a59dc53dc0a.png`.
- Mặt sau chỉ giữ Nghĩa, nghĩa đã lưu, Ví dụ/câu gốc/bản dịch/nút nghe ví dụ, câu tự đánh giá và Chưa nhớ/Đã nhớ. Bỏ nhãn từ đã lưu, trạng thái, từ tiếng Anh, phiên âm, từ loại và nút phát âm từ khỏi mặt sau.
- Hai mặt đặt tuyệt đối trong cùng một khung có tỉ lệ 372/398 và chiều cao tối thiểu 360px. Khung không phụ thuộc mặt đang mở. Nội dung mặt sau căn giữa; nếu dài, phần nội dung cuộn bên trong khung thay vì kéo giãn thẻ.
- Bằng chứng: vocabulary-equal-front.png, vocabulary-equal-back.png, vocabulary-equal-faces.png và vocabulary-equal-content-comparison.png trong design-qa-evidence. Có ảnh raw và metadata kèm theo.
- Viewport 456 × 773 CSS pixels. Đo trực tiếp cả hai mặt và khung: 420.2734375 × 449.62890625, cùng vị trí x=17.98828125, y=183.41796875, trước và sau khi lật. So sánh bằng số xác nhận chênh lệch chiều rộng/cao dưới 0.01px. Không tràn ngang hoặc cắt nội dung của từ kiểm tra.
- Chuẩn hóa: ảnh thẻ được cắt theo DOM bounds, ảnh hai mặt thu về cùng tỉ lệ. Ảnh đối chiếu nội dung cắt đúng vùng nghĩa đến các nút đánh giá và thu theo chiều rộng ảnh 2. Ảnh nguồn dùng chế độ tối, trang thực tế đang chọn sáng: khác màu là có chủ đích theo yêu cầu đồng bộ theme trước đó.
- Typography và biểu tượng giữ thiết kế hiện có; thứ tự và nhóm nội dung tương ứng ảnh 2; khung nghĩa/ví dụ và hai nút giữ bảng màu theo theme; chữ/icon vẫn là giao diện thật, không có ảnh thay thế. Nội dung dùng từ new và câu đã lưu thật.
- Trình duyệt: bấm thẻ để mở đáp án, dùng Enter để lật về, bấm nội dung mặt sau để lật về; nghe ví dụ giữ nguyên mặt sau. Không gửi đánh giá từ thật. Mặt ẩn vẫn có aria-hidden/inert.
- Cập nhật kiểm thử tương tác để xác nhận mặt sau không có tiêu đề từ/nút phát âm từ, và bấm nghĩa lật về mặt trước. 80 kiểm thử frontend trong 8 suites: passed; build Vite: passed. Cảnh báo bundle lớn có sẵn. Console không ghi nhận lỗi trong kiểm tra cuối.
- Không còn P0/P1/P2 trong phạm vi thay đổi này.

final result: passed

## Bỏ nhãn chế độ ôn và dòng gợi ý — 25/10/2026

- Bỏ toàn bộ khối trong ảnh `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-66cc3b9c-3d0f-402e-bc1b-0e803f290d08.png`: nhãn chế độ ôn cùng dòng gợi ý bên dưới, cho tất cả các cách mở phiên ôn.
- Dọn prop label, dữ liệu nhãn phiên và CSS/biến màu không còn dùng; giữ nguyên các tham số lọc và cách lấy danh sách ôn. Cập nhật kiểm thử để chờ tiêu đề màn ôn thay vì nhãn đã bỏ.
- Thẻ nằm dưới thanh tiến độ với khoảng cách 20px; hai mặt vẫn cùng kích thước. Bằng chứng: `design-qa-evidence/vocabulary-no-review-mode.png`, có raw và metadata kèm theo.
- Trình duyệt: xác nhận không còn vw-review-mode, nhãn hoặc dòng gợi ý trong cây giao diện ở cả hai mặt. Đã lật về mặt trước bằng Enter. Viewport 456 × 773; thẻ 420.27 × 449.63 tại y=113.96. Chế độ sáng theo lựa chọn hiện tại.
- 80 kiểm thử frontend trong 8 suites và build Vite: passed. Không có P0/P1/P2 trong phạm vi thay đổi này.

final result: passed

## Mặt sau nghĩa lớn và ví dụ có nút nghe bên trái — 25/10/2026

**Nguồn và kết quả**

- Ảnh đích: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-edc06795-ec47-4d2d-bd14-ad5f3707458a.png` (1218 × 1292). Vùng thẻ nguồn x=28, y=27, 1162 × 1235.
- Bỏ nhãn Nghĩa/Ví dụ và nền tím sau nghĩa. Nghĩa hiển thị lớn, đậm, căn giữa. Khung ví dụ nền tím nhạt chứa nút nghe bên trái, cạnh cả câu gốc và bản dịch. Hai nút đánh giá nằm dưới đường phân cách ở cuối thẻ.
- Giữ khung chung, lật hai chiều, cơ chế lưu kết quả và lựa chọn sáng/tối hiện có. Các màu mới có giá trị tương ứng cho cả hai chế độ.

**Bằng chứng**

- Ảnh thẻ cuối: `design-qa-evidence/vocabulary-answer-large-final.png`.
- Ảnh trang cuối: `design-qa-evidence/vocabulary-answer-large-final-page.png`.
- Đối chiếu ban đầu: `design-qa-evidence/vocabulary-answer-large-comparison.png`.
- Đối chiếu cuối: `design-qa-evidence/vocabulary-answer-large-final-comparison.png`.
- Viewport 456 × 773 CSS pixels, chế độ sáng, từ new đã mở đáp án. Hai mặt đều 420.2734375 × 449.62890625 tại x=17.98828125, y=113.96484375. Không tràn ngang hoặc cuộn nội bộ với nội dung đang kiểm tra; scrollHeight bằng clientHeight (447).
- Cắt ảnh raw theo DOM bounds để bỏ vùng trắng thừa. Giữ nguyên tỉ lệ ảnh nguồn khi chuẩn hóa về chiều rộng 420; thẻ nguồn cao khoảng 446, thẻ thực tế cao 450 do tiếp tục dùng tỉ lệ mặt trước đã chốt. Đây là khác biệt có chủ đích để giữ hai mặt bằng nhau.

**Đối chiếu thiết kế**

- Typography: nghĩa dùng Inter, cỡ khoảng 65px tại viewport kiểm tra, weight 900. Câu gốc dùng chữ vừa, từ đang học đậm màu tím, bản dịch và câu hỏi dùng màu phụ. Tất cả là văn bản thật.
- Spacing/layout: vị trí nghĩa, khung ví dụ, đường phân cách và hai nút tương ứng ảnh mẫu. Nút nghe nằm giữa hai dòng trong khung; cả câu mẫu và bản dịch hiển thị đủ. Bản đối chiếu toàn thẻ đã đủ đọc các vùng này nên không cần ảnh phóng riêng.
- Colors/tokens: nghĩa màu chữ chính trên nền thẻ; ví dụ nền lavender, nút nghe tím; lựa chọn Chưa nhớ đỏ nhạt và Đã nhớ tím. P3: dùng màu nền/nút phẳng theo UI thay cho độ chuyển màu mờ của ảnh nguồn.
- Image quality: tiếp tục dùng icon Lucide chuẩn và nội dung UI thật. P3: icon loa là nét viền của thư viện hiện có, khác nhẹ icon đặc trong ảnh. Không thay icon/chữ bằng ảnh raster.
- Copy/content: giữ đúng nghĩa, câu gốc, bản dịch, câu hỏi và hai nút của ảnh mẫu; dữ liệu lấy từ từ đã lưu thật.

**Lịch sử và kiểm tra**

- Sau đối chiếu đầu, tăng độ đậm nghĩa từ 800 lên 900. Đã chụp và đối chiếu lại ảnh cuối; không còn P0/P1/P2 trong phạm vi yêu cầu.
- Trình duyệt xác nhận nút nghe câu ví dụ giữ nguyên mặt sau. Không gửi đánh giá hoặc thay đổi tiến độ của từ thật.
- 80 kiểm thử frontend trong 8 suites: passed. Build Vite cuối: passed, còn cảnh báo kích thước bundle có sẵn. Không ghi nhận lỗi console trong kiểm tra cuối.

final result: passed

## Box video gọn ở trang Podcast — 25/10/2026

- Nguồn thiết kế mới nhất: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-ace1c35e-ce9a-46bc-85ee-d5ea1273e29d.png` (177 × 160); vùng thẻ x=6, y=7, 165 × 149.
- Áp dụng kiểu thẻ của FeaturedVideos hiện có cho PodcastChannelRow: hai thẻ cạnh nhau, thumbnail 16:9, nút phát tròn giữa ảnh, tiêu đề hai dòng và thời lượng dưới tiêu đề. Bỏ badge thời gian trên ảnh và dòng Video x / 20. Giữ danh sách 7 kênh/140 video, tiêu đề kênh, điều khiển slide và luồng mở video hiện tại.
- Bằng chứng: `design-qa-evidence/podcast-compact-cards.png`, `podcast-compact-page.png`, `podcast-compact-card.png`, `podcast-compact-comparison.png` trong cùng thư mục; có raw và metadata.
- Viewport 456 × 773 CSS pixels, chế độ sáng. Thẻ đầu thực tế 204.24 × 185.86, thumbnail 204.24 × 114.88, hai thẻ hiển thị đủ cạnh nhau. Không có tràn ngang toàn trang. Ảnh chụp đã cắt phần trắng thừa của công cụ; thẻ thực tế được chuẩn hóa cùng chiều rộng 165 để đối chiếu, giữ nguyên tỉ lệ (cao khoảng 150).
- Nguồn minh họa video Volka, trong khi trang Podcast dùng các kênh hiện có. Khác ảnh, tiêu đề và thời lượng là dữ liệu thật của từng kênh; không thay dữ liệu bằng nội dung mẫu. Ảnh thumbnail của hai thẻ đầu BBC và VOA tải thành công.
- Typography: dùng Inter và thứ bậc cỡ chữ của thẻ video sẵn có, tiêu đề 12px/16px tối đa hai dòng, thời lượng 10px. Spacing/layout: hình 16:9, khung nội dung có padding 10px, gap giữa thẻ 12px và góc bo 12px tương ứng mẫu. Colors/tokens: nền trắng, chữ chính tối, thời lượng xám, nút phát tím; có class dark tương ứng. Image quality: dùng thumbnail YouTube thật và icon Play Lucide, không tạo ảnh thay UI. Copy/content: giữ nguyên tiêu đề/thời lượng catalog, toàn bộ thẻ là liên kết có tên truy cập đầy đủ.
- Đối chiếu toàn thẻ đã đủ đọc cả ảnh, nút phát, tiêu đề và thời lượng; không cần ảnh phóng riêng. Không có P0/P1/P2 sau đối chiếu đầu tiên; không có chỉnh sửa thị giác tiếp theo.
- Trình duyệt: nút tiếp theo cuộn hàng BBC 216.25px, hàng VOA vẫn ở 0; nút trước được bật. Bấm video thứ hai mở đúng `/podcast?v=JYjXBX5kVCg`, hộp phát có đúng tiêu đề, và đóng trở lại trang Podcast. Không dùng kết quả này để khẳng định việc phát nội dung YouTube bên ngoài đã được kiểm tra đầy đủ.
- `tsc -p test/podcast/tsconfig.json`: passed. 5 kiểm thử Podcast gồm điều hướng video, đóng/Escape, URL không hợp lệ và điều khiển slide: passed. Build Vite: passed, còn cảnh báo bundle lớn có sẵn.

final result: passed

## Xem tất cả và danh sách 20 video từng kênh — 25/10/2026

**Phạm vi và nguồn**

- Nguồn bỏ mũi tên: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-a3d48441-b97d-414c-91d7-e9715c85a92f.png`.
- Nguồn danh sách: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-8d118c4d-713f-4e9c-bdcd-7b13cbbb3a78.png` (355 × 484).
- Thay hai nút mũi tên bằng liên kết Xem tất cả ở cả bảy kênh. Giữ vuốt ngang và điều khiển bàn phím cho carousel.
- Thêm `/podcast?channel=<id>` với avatar, tên kênh, liên kết YouTube, đủ 20 video dạng hàng dọc, ảnh bên trái, tiêu đề hai dòng bên phải và thời lượng trên ảnh. Có nút quay về đúng hàng kênh trong trang Podcast.
- Video từ danh sách giữ tham số channel; đóng trình phát vẫn ở danh sách đó. URL kênh không hợp lệ trở về catalog kèm thông báo; video ngoài kênh đã chọn không mở trình phát.

**Bằng chứng và chuẩn hóa**

- `design-qa-evidence/podcast-view-all.png` và `podcast-channel-list.png`.
- Đối chiếu: `design-qa-evidence/podcast-channel-list-comparison.png`. Có ảnh raw và metadata riêng.
- Kiểm tra cả khung nội dung 512px trong viewport desktop 1600 × 900 và viewport 398 × 773. Ảnh cuối dùng khung nội dung 395px, không tràn ngang, có đúng 20 liên kết video. Video cuối vẫn nằm trên thanh điều hướng khi cuộn hết trang (bottom 653.39 < nav top 709.57).
- Cắt vùng trắng thừa của công cụ theo DOM bounds. Bản đối chiếu bỏ riêng thanh quay lại ở trên vì ảnh nguồn chỉ chứa phần kênh/danh sách; chuẩn hóa cùng chiều rộng 355, giữ tỉ lệ (thực tế cao khoảng 498 so với nguồn 484).
- Ảnh nguồn dùng Volka, màn kiểm tra dùng BBC từ catalog hiện có nên khác avatar, thumbnail, tiêu đề và thời lượng. Đây là dữ liệu thật theo kênh, không thay bằng dữ liệu mẫu.

**Đối chiếu năm bề mặt**

- Typography: font hiện có của ứng dụng; tên kênh đậm, tiêu đề video 14px/20px tối đa hai dòng, thời lượng dễ đọc trên nền đen. Tiêu đề truy cập giữ đầy đủ khi chữ trên màn hình được rút gọn.
- Spacing/layout: bố cục hai cột trong từng hàng, ảnh 16:9 chiếm 44%, khoảng cách 12px và khoảng cách hàng 20px tương ứng ảnh mẫu. Avatar co theo khung, có nút quay lại bổ sung cho điều hướng.
- Colors/tokens: nền sáng, chữ tối, badge YouTube và thời lượng giống cấu trúc mẫu; các thành phần có class dark theo lựa chọn chung. Xem tất cả dùng nền tím nhạt và chữ tím.
- Image quality: dùng avatar/thumbnail thật đã có, icon Lucide, không dùng ảnh thay UI. Bốn thumbnail đầu tải thành công.
- Copy/content: đúng kênh và đủ 20 video. Ngày đăng chưa có trong catalog nên không hiển thị; đã thông báo giới hạn dữ liệu này trong commentary. Không tạo ngày đăng giả.
- P3: nhịp hàng cao hơn ảnh mẫu khoảng 3% sau chuẩn hóa do typography/viền hiện có. Không còn P0/P1/P2 trong phạm vi chức năng và bố cục danh sách.

**Kiểm tra**

- Trình duyệt: xác nhận 7 liên kết Xem tất cả, không còn nút trước/tiếp theo; mở BBC ra đúng 20 hàng và cuộn về đầu. Mở video đầu với channel=bbc, đóng lại vẫn còn danh sách BBC và body scrolling được khôi phục.
- 8 kiểm thử Podcast: passed, gồm ánh xạ liên kết của bảy kênh, danh sách 20 video, mở/đóng video, quay về catalog, URL chia sẻ, URL sai và video không thuộc kênh. TypeScript phần Podcast: passed. Build Vite cuối: passed, cảnh báo bundle lớn có sẵn.
- Không ghi nhận lỗi console từ ứng dụng trong phiên kiểm tra. Việc phát đầy đủ media YouTube bên ngoài không nằm trong kiểm chứng bố cục này.
- Tab QA riêng đã đóng sau kiểm tra; trang ứng dụng và máy chủ xem thử vẫn hoạt động.

final result: passed

## Mở bài học đầy đủ từ thẻ Podcast — 25/10/2026

**Phạm vi và nguồn**

- Thẻ nguồn: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-52e0665b-a13b-4b08-ab39-f7b90de91bb4.png`.
- Giao diện bài học tham chiếu: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-9ddddac8-baa5-49bd-a116-cfac1ae57c6f.png` (307 × 624).
- Thẻ Podcast mở toàn bộ giao diện VideoLesson đang dùng cho Volka: trình phát YouTube, thanh thời gian, tua/phát, phụ đề tương tác song ngữ và thanh công cụ học. Không còn modal phát đơn giản. Mở từ carousel hoặc danh sách đều giữ đường dẫn quay lại đúng kênh.
- Mở rộng catalog công khai dùng chung cho client/server để xác thực 140 video Podcast và 5 video Volka. Lưu từ giữ đúng câu, thời gian và tên video; bài Podcast đã lưu có thể mở lại từ Khám phá.

**Bằng chứng và đối chiếu**

- Ảnh thật: `design-qa-evidence/podcast-full-lesson.png`; bản gốc công cụ: `podcast-full-lesson-raw.png`; đối chiếu: `podcast-full-lesson-comparison.png`.
- Viewport 398 × 773 CSS pixels, khung bài học 395px, chế độ sáng. Cắt vùng trắng thừa theo DOM bounds (0, 0, 395, 773), chuẩn hóa ảnh thực tế về chiều rộng 307px khi đối chiếu. Khác chiều cao viewport tạo khác biệt chiều cao phần phụ đề; không kéo giãn ảnh. Không tràn ngang.
- Typography: giữ nguyên font, kích thước và thứ bậc của giao diện bài học trong ảnh mẫu vì dùng chung component. Tiêu đề bài rút gọn trên header, câu tiếng Anh có thể bấm từng từ, bản dịch và thời gian dùng màu phụ.
- Spacing/layout: header quay lại, video 16:9, timeline, ba nút phát/tua, vùng phụ đề cuộn độc lập và thanh công cụ cuối màn hình tương ứng mẫu. Câu đang phát có nền lavender và biểu tượng âm thanh tím.
- Colors/tokens: tiếp tục dùng token sáng/tối sẵn có của VideoLesson, nút phát tím và nền ứng dụng hiện có. Không thêm nền hoặc màu cố định khác với màn học đang dùng.
- Image quality: video YouTube thật, chữ và icon Lucide thật; không dùng ảnh raster thay UI. Khác thumbnail/nội dung video do đang mở đúng bài BBC được bấm, trong khi ảnh nguồn là bài Volka.
- Copy/content: đúng tiêu đề BBC, thời lượng 06:33, 76 câu phụ đề thật có bản dịch tiếng Việt. Ảnh chụp ở 00:46 hiển thị đúng câu trắc nghiệm đang phát. Không dùng phụ đề mẫu để chứng minh kết quả.
- Bản đối chiếu toàn màn hình đủ đọc bố cục, công cụ và phụ đề; không cần ảnh phóng riêng. Không có P0/P1/P2 trong phạm vi thay đổi này; không cần chỉnh sửa thị giác sau đối chiếu vì tái sử dụng chính giao diện tham chiếu.

**Kiểm tra**

- Trình duyệt thật: bấm thẻ BBC mở bài học; video phát và tiến độ tăng đến 00:46; câu hiện tại được tô sáng; tạm dừng hoạt động. Bản dịch có thể ẩn/hiện; tra từ `quiz` trả đúng nghĩa theo câu và hiển thị nút Lưu từ vựng. Không ghi dữ liệu cá nhân thật hoặc bật micro trong QA.
- Back từ carousel về `/podcast#bbc`; mở từ Xem tất cả giữ `channel=bbc`, back link về `/podcast?channel=bbc`.
- Phụ đề BBC thật đạt READY với 76 đoạn, mở lại dùng cache. Lần tải đầu có thể mất vài phút theo dịch vụ phụ đề hiện có.
- 130 kiểm thử liên quan passed: Podcast 10, YouTube 17, backend transcript/vocabulary 23, listening 80. TypeScript Podcast, YouTube và backend passed. Build Vite passed; còn cảnh báo bundle lớn có sẵn. Bản build backend kiểm tra riêng đọc được JSON catalog chia sẻ.
- Kiểm thử bao gồm ID video thực, điều hướng/back, URL không hợp lệ, lưu từ theo ngữ cảnh, nguồn nghe lại Podcast/Volka và bài Podcast đã lưu trong Khám phá.

final result: passed

## Bỏ nền Xem tất cả ở Podcast — 25/10/2026

- Bỏ nền tím nhạt, nền hover và bo tròn của liên kết Xem tất cả ở các hàng kênh Podcast. Giữ chữ tím, vùng bấm và focus bàn phím.
- Trình duyệt xác nhận cả 7 liên kết có background trong suốt. Bằng chứng: `design-qa-evidence/podcast-view-all-no-background.png` (có ảnh raw riêng).
- TypeScript Podcast passed. Chỉ thay class trình bày, giữ nguyên đường dẫn mở danh sách.

final result: passed

## Tinh gọn hàng tên kênh Podcast — 25/10/2026

- Bỏ dòng số lượng 20 video ở cả 7 hàng kênh. Thu avatar về 36px, căn giữa tên kênh và Xem tất cả; chỉnh khoảng cách 10px và căn mép phải liên kết theo mép nội dung thẻ. Tên dài có thể xuống dòng trong vùng riêng.
- DOM xác nhận cả 7 header chỉ còn tên kênh và Xem tất cả, không tràn ngang. TypeScript Podcast passed. Ảnh xác nhận bố cục: `design-qa-evidence/podcast-channel-header-no-count.png` (ảnh raw riêng).

final result: passed

## Lăn chuột chuyển thẻ Podcast — 25/10/2026

- Thêm wheel listener không passive vào từng hàng video. Lăn xuống/lên chuyển một thẻ theo chiều tương ứng, giữ snap và hiệu ứng hiện có. Chỉ chặn cuộn trang khi hàng vẫn có thể cuộn theo hướng đó.
- Không chặn cuộn ngang trackpad, Ctrl+wheel để zoom hoặc hàng không tràn. Khi đến biên, trả cuộn dọc cho trang; tôn trọng reduced motion và gỡ listener khi rời trang.
- Trình duyệt thật: BBC scrollLeft từ 0 lên 246.25 rồi về 0 khi lăn ngược; hàng VOA và pageY đều giữ 0. Không ghi nhận lỗi console.
- Bằng chứng sau khi lăn xuống: `design-qa-evidence/podcast-wheel-scroll.png`, có raw riêng. Các video thứ 2 và 3 đã xuất hiện thay cho thứ 1 và 2.
- 14 kiểm thử Podcast và TypeScript phần Podcast passed. Kiểm thử mới bao gồm hai chiều cuộn, tách riêng từng hàng, biên/không tràn, trackpad/zoom, reduced motion và cleanup listener.

final result: passed

## Header Podcast căn giữa — 25/10/2026

- Theo ảnh `codex-clipboard-69188f03-acab-45fc-b8cb-6ec3b94fed8e.png`, thay khối icon/tên/số lượng bằng header như ChannelPage: ChevronLeft bên trái và tiêu đề Podcast ở chính giữa.
- Bỏ icon tai nghe và dòng 7 kênh · 140 video. Nút quay lại trỏ về Trang chủ; giữ mô tả và danh sách bên dưới. Header dùng màu sáng/tối theo giao diện đang chọn.
- Trình duyệt xác nhận header cao 44px, tiêu đề có tâm trùng tâm khung nội dung, liên kết về `/`, không tràn ngang. Bằng chứng `design-qa-evidence/podcast-centered-header.png` và raw riêng.
- Typography, khoảng cách, nút quay lại và màu sắc tái sử dụng kiểu header Volka đang có; chữ và icon là UI thật. Không có P0/P1/P2 khi đối chiếu phạm vi header.
- 14 kiểm thử Podcast và TypeScript phần Podcast passed.

final result: passed

## Bỏ giới thiệu và thanh chọn kênh Podcast — 25/10/2026

- Bỏ đoạn giới thiệu và hàng chip chọn kênh theo ảnh `codex-clipboard-f8ca4bd6-a8dc-40a1-bbcd-2e6e33fce2fd.png`. Danh sách kênh bắt đầu ngay dưới header với khoảng cách 20px.
- DOM xác nhận không còn mô tả hoặc navigation Chọn kênh Podcast, vẫn có đủ 7 hàng video và không tràn ngang. Bằng chứng: `design-qa-evidence/podcast-clean-top.png`, có raw riêng.
- TypeScript phần Podcast và build Vite passed; cảnh báo bundle lớn hiện có vẫn còn.

final result: passed

## Bỏ số lượng video trên thẻ kênh ở Trang chủ — 25/10/2026

- Bỏ dòng 20 video và icon tai nghe trong PodcastHomePreview. Thẻ tự thu chiều cao theo nội dung, giữ avatar, tên kênh và liên kết mở đúng kênh.
- DOM xác nhận cả 7 thẻ chỉ còn tên kênh, các href giữ nguyên và trang không tràn ngang. Thẻ BBC đo được khoảng 152 × 150px; bằng chứng: `design-qa-evidence/home-podcast-no-count.png` và raw riêng.
- TypeScript phần Podcast passed. Không thêm kiểm thử cho thay đổi nội dung trình bày này.

final result: passed

## Slide Podcast cuộn giống Volka English — 25/10/2026

- Nguồn hành vi: ảnh `codex-clipboard-79a384eb-c00a-4643-94cb-386ac6120676.png` và FeaturedVideos hiện có. Chuyển PodcastChannelRow sang cùng HorizontalScroll của Volka, cùng visibleItems=2 và cách cập nhật kích thước theo viewport.
- Thay chuyển nguyên thẻ bằng cuộn liên tục theo wheel delta, cho phép dừng giữa hai thẻ như ảnh. Giữ cuộn ngang/trackpad, phím mũi tên, đường dẫn video và Xem tất cả. Mép cắt slide thẳng với phần nội dung tên kênh.
- Thành phần cuộn dùng chung nhận các thuộc tính HTML để giữ region, tên truy cập và focus bàn phím của Podcast. Wheel vẫn cho cuộn trang ở biên, không chặn Ctrl+wheel, và quy đổi delta line/page. Không thêm tự chạy vì slide Volka hiện tại dùng cuộn thủ công.
- Trình duyệt: một lần lăn ngắn đưa BBC từ scrollLeft 0 đến 67.5px, dừng tự do với scroll-snap-type none, VOA và pageY giữ 0. Lăn ngược trở về 0. Không có lỗi console hoặc tràn ngang trang.
- Kiểm tra cả khung 512px ở viewport 1600 × 900 và viewport 398 × 773. Hai thẻ được tính lại theo độ rộng mới. Ảnh cuối chụp ở màn hình nhỏ; `design-qa-evidence/podcast-volka-motion.png` và raw riêng.
- Bố cục thẻ, typography, màu sáng/tối và nội dung kênh giữ theo các yêu cầu trước. Khác tiêu đề/avatar/video với ảnh Volka do đang dùng dữ liệu BBC; bằng chứng cho thấy thẻ bị cắt một phần ở hai mép, tương ứng trạng thái cuộn trong ảnh nguồn.
- 31 kiểm thử passed (Podcast 14, YouTube 17). TypeScript hai phần passed. Build Vite cuối passed, còn cảnh báo bundle lớn có sẵn. Jest YouTube dùng cache trong workspace sau khi cache tạm gặp EPERM.

final result: passed

## Header Khám phá giống Podcast — 25/10/2026

- Thay tiêu đề lớn kèm Sparkles bằng header Khám phá căn giữa, ChevronLeft và liên kết về Trang chủ bên trái, theo ảnh `codex-clipboard-bc9727a0-f49c-4034-9a40-0e288e12085c.png`.
- Dùng cùng chiều cao 44px, safe-area trên, typography, màu sáng/tối và vùng bấm của header Podcast. Phần nội dung Khám phá tiếp tục hiển thị bên dưới.
- DOM xác nhận tiêu đề nằm chính giữa header, back link là `/`, không tràn ngang. Bằng chứng: `design-qa-evidence/explore-centered-header.png` và raw riêng.
- Build Vite passed; còn cảnh báo bundle lớn có sẵn. Không thêm kiểm thử cho thay đổi trình bày nhỏ này.

final result: passed

## Header Từ vựng đồng bộ Podcast và Khám phá — 25/10/2026

- Thay logo, tiêu đề lớn và dòng mô tả cũ bằng header Từ vựng căn giữa, ChevronLeft bên trái dẫn về Trang chủ, cùng kiểu với hai trang vừa chỉnh.
- Header cao 44px, cách mép trên theo safe-area tối thiểu 16px, chữ 14px semibold và màu sáng/tối theo lựa chọn chung. Gỡ CSS brand/title cũ không còn dùng.
- Trình duyệt xác nhận tiêu đề căn chính giữa, back link `/`, không tràn ngang. Ảnh: `design-qa-evidence/vocabulary-centered-header.png` và raw riêng.
- 8 kiểm thử sổ từ đã lưu và build Vite passed; còn cảnh báo bundle lớn có sẵn. Không thay đổi nội dung thẻ hoặc hành vi ôn tập.

final result: passed

## Header tên kênh YouTube trong danh sách Podcast — 25/10/2026

- Thay thanh Trở về Podcast bằng header tên kênh căn giữa và mũi tên bên trái, đồng bộ kiểu header các trang đã chỉnh. Nút quay lại giữ liên kết `/podcast#<channel-id>`.
- Tên header tối đa 30 ký tự Unicode gồm dấu …; title và aria-label giữ tên đầy đủ. CSS truncate tiếp tục bảo vệ bố cục ở khung hẹp. Tên kênh ở phần thông tin dùng h2 để trang chỉ có một h1.
- Trình duyệt VOA: header VOA Learning English, cao 44px, back về `/podcast#voa`, có đủ 20 video và không tràn ngang. Ảnh: `design-qa-evidence/podcast-channel-name-header.png` và raw riêng.
- 14 kiểm thử Podcast, TypeScript phần Podcast và build Vite passed. Cảnh báo bundle lớn hiện có vẫn còn.

final result: passed

## Header trang chủ đề đồng bộ Khám phá — 25/10/2026

- Căn tên chủ đề vào chính giữa, dùng cùng font 14px semibold, ChevronLeft 28px, chiều cao 44px và safe-area 16px như header Khám phá. Nền header chuyển sang nền sáng/tối chung; phần nội dung chủ đề giữ nền hiện tại.
- Nút quay lại và lưu chủ đề ở hai bên, có vùng bấm 44px; giữ hành vi quay lại theo lịch sử và lưu chủ đề. Tên dài dùng truncate, title và aria-label giữ đầy đủ.
- Trình duyệt xác nhận Du lịch & Khám phá căn giữa, hai nút thẳng hàng, không tràn ngang. Không bấm nút lưu trong QA để giữ trạng thái cá nhân. Bằng chứng: `design-qa-evidence/explore-category-centered-header.png` và raw riêng.
- Build Vite passed, còn cảnh báo bundle lớn có sẵn. Chỉ đổi trình bày header.

final result: passed

## Header Video của tôi đồng bộ Khám phá — 25/10/2026

- Đổi ArrowLeft sang ChevronLeft 28px, chiều cao header và vùng bấm 44px; căn tiêu đề Video của tôi chính giữa với font 14px semibold, cùng màu sáng/tối và safe-area 16px như Khám phá.
- Giữ hành vi quay về trang Cá nhân, mô tả, bộ lọc và danh sách video. Không thay đổi xử lý dữ liệu video.
- DOM xác nhận header cao 44px, tên ở giữa, không tràn ngang. Bằng chứng: `design-qa-evidence/my-videos-centered-header.png` và raw riêng.
- Build Vite passed; còn cảnh báo bundle lớn có sẵn. Không thêm kiểm thử cho thay đổi trình bày này.

final result: passed

## Thẻ Từ vựng Trang chủ theo ảnh mẫu mới — 25/10/2026

**Nguồn và phạm vi**

- Nguồn hiện trạng: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-9002571a-628d-4953-8396-4d5cd573a7d2.png`.
- Nguồn thiết kế được chọn: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-703cae37-bde7-4d8f-90ae-b7ce8640852a.png`, 1086 × 205px.
- Chỉ thiết kế lại thẻ SavedVocabularyHome. Nội dung dùng đúng tiêu đề và mô tả của ảnh mẫu ở cả hai trạng thái tài khoản; liên kết tiếp tục mở `/tu-vung`. Thành phần không cần gọi thống kê để hiển thị lời giới thiệu cố định nữa.
- Nền họa tiết được tạo bằng native imagegen từ ảnh nguồn, lưu ở `client/src/assets/vocabulary-card-background.png` (1080 × 172px, khoảng 86KB). Chữ, khung, icon và liên kết là UI thật; không dùng ảnh chụp nguyên thẻ thay nội dung.

**Bằng chứng và chuẩn hóa**

- Đối chiếu đầu: `design-qa-evidence/home-vocabulary-promo-comparison-first.png`.
- Đối chiếu cuối: `design-qa-evidence/home-vocabulary-promo-comparison-final.png`; ảnh cuối riêng ở `home-vocabulary-promo-desktop-final.png` và `home-vocabulary-promo-mobile-final.png`. Có raw riêng.
- Ảnh nguồn cắt vùng thẻ (11, 17, 1082, 187), chuẩn hóa về rộng 480px, giữ tỷ lệ, cao khoảng 76px. Thẻ thực tế khung rộng đo được 480 × 78 CSS pixels trong viewport 1600 × 900; ảnh raw 1596 × 898. Crop dùng DOM bounds và giữ khoảng mép để đọc viền.
- Kiểm tra trực tiếp trên khung người dùng 399 × 845, thẻ 363 × 81.19 CSS pixels, raw 395 × 837. Bản mobile cho mô tả xuống hai dòng để đọc đủ; đây là thích ứng theo độ rộng, không kéo giãn ảnh nguồn.
- Các bản đối chiếu đều ở chế độ sáng, trạng thái mặc định, cùng nội dung. Tài khoản không làm thay đổi nội dung thẻ mới. Toàn thẻ đã đủ đọc chữ, icon, viền và nền, nên không cần thêm ảnh phóng riêng.

**Findings và lịch sử sửa**

- P2 ở lượt đầu: nội dung lệch trái khoảng 12px và dòng mô tả lớn hơn tỷ lệ nguồn. Đã tăng inset/gap theo độ rộng thẻ, chỉnh font tiêu đề tối đa 16.3px và mô tả tối đa 12.5px. Đã chụp và đối chiếu lại.
- P2 ở mobile: mô tả để riêng từ cuối ở dòng thứ hai. Đã dùng text-wrap balance; ảnh mobile cuối hiển thị hai dòng cân đối, không mất chữ.
- Đối chiếu cuối không còn P0/P1/P2 trong phạm vi thẻ.

**Năm bề mặt fidelity**

- Typography: dùng Inter sẵn có; tiêu đề đậm, mô tả nhỏ hơn và có màu phụ. Cỡ chữ co theo container, tiêu đề tối thiểu 13px và mô tả 11px ở màn hình nhỏ; toàn bộ là chữ thật.
- Spacing/layout: thanh nhấn trái, tile icon bo góc, hai dòng nội dung và vòng tròn mũi tên tương ứng ảnh mẫu. Hai kích thước kiểm tra đều không tràn ngang. Vùng bấm là toàn bộ thẻ.
- Colors/tokens: viền và accent xanh tím, nền sáng, chữ chính tối; mô tả dùng màu đậm hơn nguồn một chút để tăng độ tương phản. Có màu dark theo lựa chọn chung; dark chưa được đổi trực tiếp trong phiên QA để giữ tùy chọn người dùng.
- Image quality: dùng ảnh nền thật được tạo từ nguồn, không có chữ/icon bị bọc vào nền. P3: đường cong/ribbon là bản tạo gần với nguồn; icon BookOpen của thư viện Lucide không có ba tia nhỏ như ảnh mẫu. Giữ icon thư viện phù hợp ứng dụng, không vẽ thêm icon thủ công.
- Copy/content: đúng “Giữ lại những từ bạn muốn nhớ” và “Lưu từ khi học podcast và ôn lại bất cứ lúc nào.”. Thống kê và dữ liệu trong sổ từ không bị sửa.

**Kiểm tra và checklist**

- Đã bấm thẻ trong tab QA và xác nhận mở trang Từ vựng. Không ghi tiến độ, lưu từ hay thay đổi dữ liệu người dùng.
- Không có lỗi console trong kiểm tra thẻ. Asset nền tải và hiển thị đúng; bố cục điện thoại và khung rộng đã được kiểm tra bằng ảnh thật.
- Build Vite cuối passed, asset PNG được đóng gói thành công; còn cảnh báo bundle lớn có sẵn.
- Focus bàn phím và reduced motion có CSS riêng; không thêm kiểm thử mô phỏng cho thay đổi trình bày này.
- Checklist hoàn tất: asset được đưa vào UI; không còn nội dung cũ ở thẻ; link hoạt động; P2 đã sửa và có bằng chứng sau sửa. Tab Trang chủ của người dùng vẫn được giữ mở.

final result: passed

## Header Cá nhân đồng bộ Khám phá — 25/10/2026

- Thêm header Cá nhân căn giữa trên cùng, có ChevronLeft 28px và liên kết về Trang chủ. Chiều cao 44px, safe-area trên tối thiểu 16px, typography và màu sáng/tối giống header Khám phá.
- Phần thông tin tài khoản nằm dưới header; đổi tên tài khoản thành h2 để toàn trang chỉ có một h1. Không đổi dữ liệu hoặc cài đặt tài khoản.
- DOM xác nhận title ở giữa, back link `/`, một h1 và không tràn ngang. Bằng chứng đã cắt riêng vùng header: `design-qa-evidence/profile-centered-header.png`.
- Build Vite passed; còn cảnh báo bundle lớn có sẵn. Không thêm kiểm thử cho thay đổi trình bày này.

final result: passed

## Thêm video ở Video của tôi mở hộp chọn nguồn — 25/10/2026

- Nguồn giao diện: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-57511304-3642-44e8-a8c0-a97c9a505b7d.png`; trang cần áp dụng: ảnh `codex-clipboard-32bb48e6-ed32-46f3-92ca-cae11d026d3d.png`.
- Tách AddVideoButton từ luồng Trang chủ đang có để Trang chủ và Video của tôi cùng dùng một hộp chọn và hai luồng nhập. Nút ở Video của tôi mở hộp Nhập Video hoặc Âm thanh ngay trên trang thay vì chuyển trang ngay.
- Giữ nguyên giao diện, hoạt ảnh đóng/mở, bản dịch copy, icon Video/FileVideo, giao diện dán URL, chọn tệp, tiến trình xử lý và mở bài học sau khi sẵn sàng. Trường hợp hết hạn mức giữ đúng trang quay lại theo nơi mở hộp.
- Trình duyệt thật: bấm Thêm video tại `/video-cua-toi` mở đủ hai lựa chọn; chọn URL Youtube mở ô nhập, nút Lưu bị vô hiệu khi trống. Bấm Đóng vẫn ở Video của tôi và cuộn trang được phục hồi. Sau đó kiểm tra Trang chủ vẫn mở cùng hộp và Escape đóng được. Không tạo hoặc tải lên video thật trong phiên UI QA.
- Bằng chứng: `design-qa-evidence/my-videos-source-sheet.png`; đối chiếu `my-videos-source-sheet-comparison.png`. Ảnh được cắt riêng hộp thoại, không giữ bản raw chứa danh sách video cá nhân.
- So sánh ở cùng mật độ pixel: vùng hộp nguồn 399 × 296, hộp thực tế 512 × 296 CSS pixels trong viewport 1600 × 900. Khác độ rộng do khung ứng dụng tối đa 512px; kiểu chữ 18px/16px/14px, chiều cao hàng, viền, bo góc và khoảng cách giữ đúng thành phần nguồn. Ngắt dòng thay đổi theo độ rộng. Nền bên dưới là danh sách video của trang đích, được làm mờ như yêu cầu.
- Không còn P0/P1/P2 trong phạm vi yêu cầu. Font/typography, layout, màu sáng/tối, icon/độ nét và nội dung đều tái sử dụng từ luồng Trang chủ. Toàn hộp đủ đọc nên không cần ảnh phóng riêng.
- 9 kiểm thử mới passed: mở/đóng tại My Videos, YouTube READY, nhập tệp READY, hủy chọn tệp, polling tiến trình, lỗi nhập, quota theo hai trang và cleanup. TypeScript cho thành phần chung, HomePage và MyVideosPage passed. Build Vite passed, còn cảnh báo bundle lớn có sẵn. Không ghi nhận lỗi console trong UI QA.

final result: passed

## Sticky page headers and background page data — 2026-10-25

- Added a shared opaque, theme-aware sticky header wrapper to Home, Explore (including category lists), Podcast (including channel lists), Volka channel, Vocabulary, My Videos, Profile, History and the video import form. Kept the existing stationary learning/player headers and the existing sticky level/upgrade/payment/admin navigation. Auth/reset headers now stick without a hidden overflow ancestor. Vocabulary review and listening practice headers stick as well; the desktop practice sidebar measures the header height to stay below it.
- Browser scroll checks: Home y=365, Explore y=1125, category list y=379, Podcast y=1125, VOA channel list y=1125, Volka channel y=60, Level/Upgrade y=96; navigation headers stayed at y=0. Guest Vocabulary and video import form were shorter than the viewport and had sticky headers at y=0. Private Profile/My Videos and the Pro practice view were access gated in the browser; no account/session data was changed to bypass this. Header screenshot: `design-qa-evidence/sticky-podcast-scroll.png`.
- Global warmup now runs at any entry route. Active packages/access metadata start immediately; video list/quota and signed-in vocabulary/stats follow authentication resolution. Shared promises prevent duplicate GETs, including React StrictMode and a page opened during warmup. Vocabulary and video pages initialize from fresh cache data. No upload, translation generation, transcript preparation, review submission or payment operation runs during warmup.
- Cache invalidates on relevant vocabulary/media/access changes and login/logout. Late invalidated responses cannot restore old account data. Failed reads remain retryable and independent; cancelling a vocabulary view does not cancel another cache consumer.
- Validation: background prefetch 18/18; video import 9/9; Podcast 14/14; YouTube lessons 17/17; listening practice 80/80. Scoped prefetch and listening TypeScript checks pass. Vite client build passes (existing large bundle warning). Full client TypeScript still reports five existing errors in Explore, History, Profile and the unused SpeakingHistory page; no new errors were reported.
- Details and cache lifetimes: `docs/background-prefetch.md`.

## Podcast Premium preview — 2026-10-26

- Added Admin → Nội dung → Podcast with catalog/channel/status search, per-video Premium switch, validated preview seconds (120 = 02:00, 0 = immediate gate), explicit save, persisted policy and editable retry after failures. Existing settings remain open until admin saves a Premium policy.
- Added admin-only PUT and read-only access APIs. Entitlements are resolved server-side for guests, Free, expired Premium, active Premium and admins. Generated transcript responses are filtered at the preview boundary and marked private/no-store; generated featured storage is blocked from direct public /media access.
- Shared YouTube/Podcast player waits for entitlement, caps the native embed, checks timeline/deep-link/native state/repeat paths, pauses/clamps at cutoff, then opens the accessible upgrade dialog. Replay/close returns to paused preview; logout/expiry removes previously granted full playback/transcripts. Access refreshes on visibility/focus/local changes and every 30 seconds. Known catalog imports route through the same guarded catalog player.
- Database: regenerated Prisma Client; applied only the additive podcast_access table SQL using the project's PostgreSQL driver after Prisma CLI hit a Windows TLS error. No individual video setting was changed. Read-only runtime endpoint returned 200 with the default open policy; a known cached transcript file returned 404 via direct /media access.
- Runtime browser: admin URL correctly redirected the unauthenticated test tab to login. The existing open Volka lesson loaded the new entitlement API, native player and cached bilingual transcript successfully. Admin save and the cutoff/upgrade states were tested through rendered React components with isolated API/player mocks; no user account or live policy was changed for browser QA.
- Validation: 27 backend authorization/service/transcript tests and 24 player/admin tests passed. Existing regressions: Podcast 14, YouTube 17, background prefetch 18, video import 9 passed. Backend Nest build, Vite client build and scoped Premium/prefetch TypeScript checks passed. Full client typecheck retains five pre-existing errors outside this feature; Vite retains the existing large bundle warning.
- Product limit: public YouTube source uploads remain independently accessible; this is an application preview restriction rather than DRM. Setup and behavior: docs/podcast-premium.md.

## Podcast cutoff correction — 2026-10-26

- Reproduced the reported H5qcIEH1iVs case in the user's Chrome context. The profile displayed a Free plan while the account could access admin content. The original iframe had no end limit and was at 00:22. Public settings correctly contained Premium=true and previewSeconds=20.
- Root cause: PodcastAccessService treated ADMIN role as an unconditional Premium entitlement. Removed that override; managing settings and having an active Premium subscription are now independent. Free/expired admins receive the same preview limit as other Free users; valid Premium admins retain their subscription expiry deadline.
- Restarted the identified local backend on port 3000 after rebuilding so the compiled server used the corrected rule. The configured video policy stayed at 20 seconds.
- Browser verification: the same signed-in Free account then received the 00:20 preview banner, a limited transcript and an iframe with end=20. Playing the real YouTube video opened the Nâng cấp Premium dialog with the 00:20 cutoff message. Evidence: design-qa-evidence/podcast-20s-verified.png.
- Also guarded repeated native pause/seek callbacks while the gate is open to avoid repeated seeks and buffering loops.
- Tests: backend 31/31 and player/admin 26/26 pass; scoped frontend TypeScript, Nest build and Vite client build pass. Added explicit Free-admin/20-second, expired-admin, Premium-admin deadline and native player callback regression coverage.

## Premium dialog copy and replay — 2026-10-26

- Shortened the preview dialog description to “Nâng cấp Premium để nghe tiếp toàn bộ podcast.” and the secondary button to “Nghe lại”.
- X, Escape and Nghe lại use one replay handler: close the dialog, clear a previous sentence replay endpoint, seek to zero and call playVideo. The preview gate remains active for the next pass; zero-length Premium previews cannot autoplay.
- Validation: player/admin suite 27/27, scoped Premium TypeScript and Vite client build pass. Existing regression coverage now verifies automatic restart via both X and Nghe lại, keyboard close, and locking again at the preview boundary.

## Preview transcript bottom spacing — 2026-10-26

- Replaced the 45vh transcript bottom padding with a normal 16px inset when the video has a preview limit, preventing a large empty scroll region after the last available subtitle. Full-access transcript scrolling keeps its existing alignment padding.

## Production Premium replay correction — 2026-10-26

- Reproduced both X and Nghe lại leaving the upgrade dialog open at the public H5qcIEH1iVs production URL. No browser console errors appeared. A regression with delayed iframe time updates reproduced the immediate re-lock with the old handler for both buttons before the fix.
- Replay now uses loadVideoById with startSeconds=0 and the configured endSeconds. A bounded restart state waits for the iframe to acknowledge time near zero, ignores stale end events, reapplies the selected playback rate, and stops again if restart never acknowledges within 10 seconds. Policy/player changes cancel that state.
- Actual YouTube browser verification on the production build served at localhost:3000: initial playback opened the gate at 20 seconds; Nghe lại closed it, returned the app timeline to 00:00 and automatically advanced to 00:04 with the pause control visible. The next pass locked again. X then returned to 00:00 and automatically advanced to 00:04 as well. Evidence: design-qa-evidence/podcast-replay-from-x.png. The live website has not been deployed by this task.
- Validation: Premium player/admin 32/32, Podcast 14/14 and YouTube 17/17 pass; scoped Premium TypeScript and Vite production build pass. Existing large bundle warnings remain.
## Podcast channel/video administration — 2026-10-26

- Added database-backed channels, videos and durable import previews. Initial backfill keeps the existing 8 channels/145 video ids, old lesson URLs, Premium policies, histories and saved-word references. Inserts skip existing rows and never overwrite visibility or Premium choices. Additive schema SQL and an idempotent apply script are recorded in prisma/updates/20261026_podcast_catalog.sql and scripts/apply-podcast-catalog.mjs.
- Admin -> Podcast now includes channel cards, channel creation from a YouTube URL/handle, per-channel video search/visibility, separate newer/older import actions, single-video URL import, persistent job history, selection before publishing and the existing Premium settings. Failed commits retain the preview and selection. Missing YouTube credentials have a clear setup state.
- Public Home, Podcast, Volka lessons/channel, saved lesson cards, imported-video redirects and vocabulary source validation use the dynamic catalog. Catalog reads are prefetched and refreshed with the shared cache; Premium still uses server entitlement checks. The configured H5qcIEH1iVs Premium flag and 20-second cutoff remained unchanged in the actual admin screen.
- Backend queue claims have a recoverable lease and use conditional updates/advisory channel locks. Commit validates selected ids against server-fetched candidates, is idempotent and skips duplicates. Metadata requests use fixed Google API endpoints, timeouts, bounded scanning, channel ownership checks and unavailable/non-embeddable/live-video filtering.
- PostgreSQL integration ran in a disposable schema and passed seed repeatability, selected import, duplicate/concurrent submission/commit, newer/older discovery, expired-worker recovery, visibility, new channel creation, wrong-channel rejection, dynamic lesson paths and Premium for imported videos. That schema was removed after the run; no test video was inserted into the real catalog.
- Runtime: restarted only the verified Node process serving this workspace on local port 3000. Public API returned 8 channels/145 videos. The signed-in admin rendered the real catalog and existing Premium setting. Live YouTube discovery returned one eligible BBC video in a persisted READY preview; it was not published. Public BBC list rendered the original 20 video links from the API. Screenshot: design-qa-evidence/podcast-admin-import-preview.png.
- Validation: backend catalog/access/transcript/vocabulary 82 tests; admin/player 39; Podcast 16; YouTube 17; prefetch 18; video import 9, all passing. Nest and Vite builds and scoped Premium TypeScript pass. Full client TypeScript retains the same five pre-existing errors in Explore, History, Profile and SpeakingHistory; Vite retains its existing large bundle warning.
- Local YouTube configuration was verified via a live metadata request without printing the key. No production deployment, automatic scheduled sync or unrequested publishing was performed. Usage, setup and rollback notes: docs/podcast-catalog.md.

## Subtitle sentence segmentation — 2026-10-27

- Reproduced mgfBmnD04Q8: the English locale caption track had almost no sentence punctuation. The previous merge rule joined continuous cues into 46 paragraphs, including one with 396 words over 158.893 seconds. The original English track retained sentence punctuation.
- Prefer the available English caption track with sentence punctuation, with original-language tracks first for ties. Preserve sentence/pause boundaries and limit continuous unpunctuated speech to 40 words / 18 seconds, choosing clause or word-pause boundaries where available. Very short utterances may retain a longer silence window.
- Clip overlapping caption display windows before splitting their sentences so speech stays in source order. Consume word timestamps in sequence to prevent repeated phrases from reusing the preceding phrase's time range.
- New featured transcripts use transcript-v3.json. Readable v2 caches remain reusable; oversized legacy caches become PENDING and regenerate on the player's existing explicit preparation request. Old v2 files remain intact. Personal import pipeline version is now 14. Owned saved podcast vocabulary retains its original replay range after subtitle boundaries change; source visibility and player Premium checks still apply.
- Regenerated the example locally from cached English captions using the configured translation provider: 235 bilingual rows, maximum 39 words / 16.7925 seconds, no overlapping row windows. All 235 Vietnamese translations are present. No media download, account data, catalog publication or Premium policy change was required.
- Browser verification at localhost:3000: DOM rendered 235 rows / maximum 39 English words; selecting the living-room sentence sought to 00:05, and real YouTube playback advanced with the shorter sentence cards. Screenshot: design-qa-evidence/subtitle-sentences-mgfBmnD04Q8.png.
- Validation: 98 backend caption/translation/cache/vocabulary/access tests and 39 player/admin Premium tests passed. Backend TypeScript compilation passed with tsc -p tsconfig.build.json --incremental false. Standard Nest build could not clean a locked dist file on Windows; compilation without deleting the output directory succeeded. No production deployment was performed.

## Catalog-wide subtitle repair — 2026-10-27

- Audited all 146 database catalog videos across 8 channels, including hidden entries, against the local subtitle store. Eleven had existing transcripts; 135 had none and were recorded as MISSING rather than treated as checked content. Ten additional cached videos had long utterances, overlapping sentence windows or invalid word timestamps; the previously repaired mgfBmnD04Q8 remained valid.
- Rebuilt nine bilingual transcripts from their cached English caption tracks. Repaired two zero-duration final-word timestamps in q4PkX8_xUYk without changing its English or Vietnamese text. A new maintenance command defaults to audit-only; --apply handles affected files one at a time, validates before atomic publication, keeps v2 files, backs up any replaced v3 and records progress/failures. Re-running skips valid transcripts. Instructions: docs/podcast-subtitles.md.
- Bulk preflight exposed residual overlaps at fast speaker changes, including a repeated reply whose estimated start moved backwards. Separate adjacent overlap windows and rescale their word timings while preserving source sentence order. Legacy cache reads now reject overlapping windows, invalid word timings and empty translations as well as oversized paragraphs.
- Completed 10/10 repairs with zero failures. Post-check: all 11 cached transcripts load READY through the real FeaturedVideoService reader; 3,842/3,842 rows have Vietnamese translations, maximum 40 words / 17.5777 seconds, no remaining validation issues. SHA-256 comparison confirmed all 11 original cache files remain unchanged. No catalog visibility, Premium policy, account or saved vocabulary data was changed.
- Validation: 104 backend tests (the final added repeated-reply regression passed in the 41-test translation suite) and 6 maintenance-tool tests passed. Backend TypeScript compilation passed. Browser replay was not claimed for this batch: port 3000 is currently used by another project, whose process was left running. Validation used the project's compiled subtitle reader directly.
- Detailed per-video report: output/podcast-subtitle-repair-2026-10-27.md; machine-readable before/after audit: output/podcast-subtitles-2026-10-27T13-46-53-374Z.json. This run changed local subtitle files only; production still requires the same audit/repair against its own subtitle store.

## Missing podcast bilingual generation — 2026-10-27

- Requested batch: the 135 MISSING videos from the previous 146-video audit, about 102 hours of source media. Added explicit --include-missing selection, bounded --workers=1..3 and optional --limit smoke runs. Valid cached transcripts remain skipped.
- Added resumable English, translation-batch and speech-recognition checkpoints. Large audio uses 600-second PCM chunks below the upload size limit, with absolute video offsets restored. Fixed zero/invalid word estimates, short utterance estimates, silent exercise gaps and final-word bounds after video-duration clipping. Regression tests cover cache reuse, changed timestamps, chunk offsets, stopping batch scheduling on failures and the exact endpoint.
- Completed 123/135 new bilingual videos before the configured api.openai.com account returned HTTP 429: “You have no credits remaining.” Stopped the generation worker; 12 videos remain unpublished as bilingual transcripts. Their English preparation and completed translation checkpoints remain saved. No credits were purchased. Quota-aware stopping and atomic progress reports now avoid scheduling new videos/batches after a hard provider limit.
- Final data verification: 134 completed transcripts including the 11 originals; 62,785 bilingual rows total, 58,943 new. Maximum 40 words; rows with 8+ words maximum 17.9516 seconds. No remaining validation issues in completed files; all load READY through FeaturedVideoService. Original 11 v3 hashes are unchanged. Local API on port 3004 returned 200/READY for DJmnSXDGrBc (8 rows), BZRChsC0JzY (1,600) and IQ4JVWdj4Q0 (2,226).
- Browser: generated English/Vietnamese rows and timestamps rendered correctly; evidence is design-qa-evidence/podcast-bilingual-generation.png. Native YouTube playback worked for the VOA sample and reported captions unavailable, supporting the speech-recognition fallback. Embedded playback in the QA tab failed to connect, so embedded seek/play synchronization was not claimed. Temporary QA backend on port 3101 was stopped; the user's other project on port 3000 was left untouched.
- Validation: 111 backend tests and 10 maintenance tests passed; backend TypeScript compilation passed. Completed-only archive contains 134 v3 transcripts and manifest (14.15 MiB); a separate pending-checkpoint archive contains saved work for the remaining 12 (6.62 MiB). Both ZIP CRC checks passed; only subtitle/checkpoint JSON is packaged, with no credentials or source audio.
- Delivery and remaining blocker: output/podcast-bilingual-generation-2026-10-27.md and its JSON manifest. Production subtitle files were not updated. Resume the documented command after the human adds credits to the existing API account; the pending 12 are required to finish the user's full request.

## Public catalog Redis and initial loading — 2026-10-27

- Added shared Redis cache for public Podcast catalog (5 minutes), categories/popular categories and lesson lists (15 minutes). Admin import/publication, visibility and transcript-status updates invalidate the Podcast key after successful writes. Actor-specific access, Premium checks, private histories and saved vocabulary remain outside this cache.
- Bounded Redis commands, offline fallback, reconnect/warmup, compressed values and token-fenced publication keep the source available and prevent a stale in-flight read from republishing after invalidation. Local Docker Redis is bound only to 127.0.0.1:6380, with memory limits and TTL-based disposable data.
- Lazy-loaded route pages, generated a small featured-lesson summary for Home, prioritized the current route's API reads before idle background work and enabled HTTP compression outside media paths. Entry JavaScript decreased from 1,535,443 to 307,313 bytes (80%); gzip entry decreased from 410,877 to 96,219 bytes (77%). Later lesson/phonemize chunks still have existing size warnings.
- Local API measurement: Podcast catalog median TTFB 517 ms before (5 reads) and 3.8 ms with Redis (7 reads); raw JSON is byte-equivalent, with HTTP transfer reduced from 44,809 to 9,726 bytes via gzip. Categories and featured lessons medians were 2.3 and 3.7 ms. These are local warm-cache API/entry measurements, not production full-page timings.
- Real Redis integration: 30 concurrent requests across two service instances shared one source load; cross-instance invalidation during a fill, TTL expiry and corrupted-payload recovery passed. Stopping the owned Redis container left all three catalog APIs returning 200 with the same content; restarting recovered automatic warmup and positive TTL. Redis was left healthy.
- Browser checked the built client on localhost:3101: Home, Podcast, Explore and guest Vocabulary rendered correctly. No JavaScript warnings/errors were recorded in those checks. The original server on port 3004 was left running; port 3000 belongs to another project. Production was not deployed.
- Validation: 105 backend, 16 Podcast, 39 Premium player/admin and 21 prefetch tests passed, plus real Redis integration. Import cache tests verify invalidation after commit and no invalidation after rollback. The actual guest playback API still returns canListenFull=false, previewLimitSeconds=20 and private/no-store for H5qcIEH1iVs. Backend TypeScript, scoped prefetch TypeScript and Vite build passed. Full-client TypeScript retains the five pre-existing unrelated errors documented above. Browser evidence: design-qa-evidence/redis-first-load.png. Usage, production configuration and rollback: docs/public-catalog-cache.md. Measurements: output/redis-performance-summary.json.
