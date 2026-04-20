/**
 * VNR Department Library - UI Component System
 */

const VnrUI = {
    init() {
        this.injectDialog();
        this.setupRevealAnimations();
    },

    injectDialog() {
        const dialogHTML = `
      <div class="vnr-dialog-overlay" id="vnr-dialog-overlay">
        <div class="vnr-dialog">
          <div class="vnr-dialog-icon" id="vnr-dialog-icon">📚</div>
          <h3 id="vnr-dialog-title">Confirm Action</h3>
          <p id="vnr-dialog-msg">Are you sure you want to proceed?</p>
          <div class="vnr-dialog-btns">
            <button class="vnr-btn vnr-btn-cancel" id="vnr-dialog-cancel">Cancel</button>
            <button class="vnr-btn vnr-btn-confirm" id="vnr-dialog-confirm">Confirm</button>
          </div>
        </div>
      </div>
    `;
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
    },

    setupRevealAnimations() {
        const reveals = document.querySelectorAll('.reveal, .feature-card, .role-card, .stat-card');
        reveals.forEach(el => el.classList.add('reveal'));

        const revealOnScroll = () => {
            reveals.forEach(el => {
                const windowHeight = window.innerHeight;
                const revealTop = el.getBoundingClientRect().top;
                const revealPoint = 150;
                if (revealTop < windowHeight - revealPoint) {
                    el.classList.add('active');
                }
            });
        };

        window.addEventListener('scroll', revealOnScroll);
        revealOnScroll(); // Initial check
    },

    /**
     * Custom replacement for alert() and confirm()
     * @param {Object} options { title, msg, icon, confirmText, cancelText, showCancel }
     * @returns {Promise}
     */
    dialog(options = {}) {
        const overlay = document.getElementById('vnr-dialog-overlay');
        const titleEl = document.getElementById('vnr-dialog-title');
        const msgEl = document.getElementById('vnr-dialog-msg');
        const iconEl = document.getElementById('vnr-dialog-icon');
        const confirmBtn = document.getElementById('vnr-dialog-confirm');
        const cancelBtn = document.getElementById('vnr-dialog-cancel');

        titleEl.textContent = options.title || 'Attention';
        msgEl.textContent = options.msg || '';
        iconEl.textContent = options.icon || '📚';
        confirmBtn.textContent = options.confirmText || 'OK';
        cancelBtn.textContent = options.cancelText || 'Cancel';
        cancelBtn.style.display = options.showCancel === false ? 'none' : 'block';

        overlay.classList.add('active');

        return new Promise((resolve) => {
            const cleanup = (result) => {
                overlay.classList.remove('active');
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                resolve(result);
            };

            const onConfirm = () => cleanup(true);
            const onCancel = () => cleanup(false);

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
    },

    showSuccess(msg) {
        return this.dialog({ title: 'Success', msg, icon: '✅', showCancel: false, confirmText: 'Awesome' });
    },

    showError(msg) {
        return this.dialog({ title: 'Error', msg, icon: '❌', showCancel: false, confirmText: 'Got it' });
    },

    showConfirm(msg, title = 'Confirm') {
        return this.dialog({ title, msg, icon: '❓', showCancel: true });
    }
};

VnrUI.init();
window.VnrUI = VnrUI;
