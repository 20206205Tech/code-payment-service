export const SWAGGER_DOCS_PATH = 'docs';
export const SWAGGER_AUTH_KEY = 'bearerAuth';
export const SWAGGER_UI_CDN =
  'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5';
export const SWAGGER_CUSTOM_FAVICON =
  'https://avatars.githubusercontent.com/u/251744857?s=400&u=018acf9b463484b3c43dacc69db8320a0655afba&v=4';
export const SWAGGER_DESCRIPTION = `<table border="0">
  <tr>
    <td>
      <h3>Giới thiệu</h3>
      <ul>
        <li>Đây là API cho <code>${process.env.NAME_SERVICE || 'ToeicHUST'}</code></li>
        <li><a href="https://github.com/${process.env.NAME_SERVICE || 'ToeicHUST'}">Xem thông tin github</a></li>
      </ul>
      <h3>JSON và YAML docs:</h3>
      <ul>
        <li><a href="/${SWAGGER_DOCS_PATH}/json">Xem thông tin json</a></li>
        <li><a href="/${SWAGGER_DOCS_PATH}/yaml">Xem thông tin yaml</a></li>
      </ul>
    </td>
    <td valign="top">
      <img src="${SWAGGER_CUSTOM_FAVICON}" alt="toeicHUST" width="200"/>
    </td>
  </tr>
</table>`;
