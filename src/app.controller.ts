import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot(): Record<string, string> {
    return {
      message: 'Hello World',
      docs: '/docs',
    };
  }

  // @Get('all-User')
  // @Auth.User() // 1. Tương đương Depends(get_current_user), tự động add Swagger Bearer Auth
  // getMyBookmarks(
  //   @Query('skip') skip: number = 0,
  //   @Query('limit') limit: number = 100,
  //   @CurrentUserId() userId: string, // 2. Tương đương Depends(get_current_user_id)
  // ) {
  //   // // 3. Gọi xuống service
  //   // const data = this.bookmarksService.getBookmarks(userId, skip, limit);
  //   // return { success: true, message: 'Lấy danh sách bookmark thành công', data };
  //   return 'User';
  // }

  // @Get('all-Admin')
  // @Auth.Admin() // Yêu cầu token hợp lệ VÀ role = 'admin'
  // getAllSystemData(@CurrentUserId() adminId: string) {
  //   // return this.systemService.getAllData();
  //   return 'Admin';
  // }

  // @Get('public-info')
  // @Auth.Public() // Bỏ qua JwtAuthGuard
  // getPublicInfo() {
  //   return 'Ai cũng xem được';
  // }
}
