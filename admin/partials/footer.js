module.exports = function renderAdminFooter(ctx = {}) {
  with (ctx) {
    const includeChartJs = activePage === 'dashboard';
    return `</div><!-- /.container-fluid -->
</section><!-- /.page-body -->
</div><!-- /#main-content -->
</div><!-- /.wrapper -->

<div class="position-fixed bottom-0 end-0 p-3" style="z-index:9999">
  <div id="settings-toast" class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-check-circle-fill me-2"></i>Pengaturan berhasil disimpan!
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  </div>
</div>

  ${includeChartJs ? '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"><\\/script>' : ''}
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
`;
  }
};
