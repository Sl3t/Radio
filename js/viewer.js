/**
 * RadioAnalyzer - Image Viewer Module
 * Handles image display, zoom, pan, and anomaly overlay
 */

class ImageViewer {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.canvasContainer = document.getElementById('canvasContainer');
        this.imageCanvas = document.getElementById('imageCanvas');
        this.overlayCanvas = document.getElementById('overlayCanvas');
        this.selectionBox = document.getElementById('selectionBox');

        this.imageCtx = this.imageCanvas.getContext('2d');
        this.overlayCtx = this.overlayCanvas.getContext('2d');

        this.image = null;
        this.originalWidth = 0;
        this.originalHeight = 0;

        // Transform state
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 10;
        this.offsetX = 0;
        this.offsetY = 0;

        // Interaction state
        this.isDragging = false;
        this.isDrawing = false;
        this.drawMode = false;
        this.lastX = 0;
        this.lastY = 0;
        this.selectionStart = null;

        // Anomalies
        this.anomalies = [];
        this.visibleAnomalies = new Set();
        this.showOverlay = true;

        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Mouse events for pan
        this.canvasContainer.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));

        // Wheel event for zoom
        this.canvasContainer.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        // Prevent context menu
        this.canvasContainer.addEventListener('contextmenu', e => e.preventDefault());
    }

    /**
     * Load image from file
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    this.image = img;
                    this.originalWidth = img.width;
                    this.originalHeight = img.height;

                    // Reset transform
                    this.scale = 1;
                    this.offsetX = 0;
                    this.offsetY = 0;

                    // Clear anomalies
                    this.anomalies = [];
                    this.visibleAnomalies.clear();

                    // Setup canvases
                    this.setupCanvases();

                    // Fit image to container
                    this.fitToContainer();

                    // Draw
                    this.draw();

                    resolve({
                        width: img.width,
                        height: img.height,
                        base64: e.target.result.split(',')[1],
                        mimeType: file.type
                    });
                };

                img.onerror = () => reject(new Error('Impossible de charger l\'image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Setup canvas dimensions
     */
    setupCanvases() {
        // Set canvas size to image size
        this.imageCanvas.width = this.originalWidth;
        this.imageCanvas.height = this.originalHeight;
        this.overlayCanvas.width = this.originalWidth;
        this.overlayCanvas.height = this.originalHeight;
    }

    /**
     * Fit image to container
     */
    fitToContainer() {
        const containerRect = this.container.getBoundingClientRect();
        const padding = 40;

        const scaleX = (containerRect.width - padding) / this.originalWidth;
        const scaleY = (containerRect.height - padding) / this.originalHeight;

        this.scale = Math.min(scaleX, scaleY, 1);
        this.offsetX = 0;
        this.offsetY = 0;

        this.updateTransform();
        this.updateZoomDisplay();
    }

    /**
     * Draw image on canvas
     */
    draw() {
        // Clear and draw image
        this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        this.imageCtx.drawImage(this.image, 0, 0);

        // Draw overlay
        this.drawOverlay();
    }

    /**
     * Draw anomaly overlay
     */
    drawOverlay() {
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        if (!this.showOverlay) return;

        this.anomalies.forEach(anomaly => {
            if (!this.visibleAnomalies.has(anomaly.id)) return;

            const box = anomaly.bounding_box;

            // Convert normalized coordinates (0-1000) to pixel coordinates
            const x = (box.xmin / 1000) * this.originalWidth;
            const y = (box.ymin / 1000) * this.originalHeight;
            const width = ((box.xmax - box.xmin) / 1000) * this.originalWidth;
            const height = ((box.ymax - box.ymin) / 1000) * this.originalHeight;

            // Draw semi-transparent fill
            this.overlayCtx.fillStyle = this.hexToRgba(anomaly.color_hint, 0.2);
            this.overlayCtx.fillRect(x, y, width, height);

            // Draw border
            this.overlayCtx.strokeStyle = anomaly.color_hint;
            this.overlayCtx.lineWidth = 3;
            this.overlayCtx.strokeRect(x, y, width, height);

            // Draw label background
            const label = anomaly.label;
            this.overlayCtx.font = 'bold 14px Inter, sans-serif';
            const textMetrics = this.overlayCtx.measureText(label);
            const labelHeight = 24;
            const labelPadding = 8;

            this.overlayCtx.fillStyle = anomaly.color_hint;
            this.overlayCtx.fillRect(
                x,
                y - labelHeight - 4,
                textMetrics.width + labelPadding * 2,
                labelHeight
            );

            // Draw label text
            this.overlayCtx.fillStyle = '#FFFFFF';
            this.overlayCtx.textBaseline = 'middle';
            this.overlayCtx.fillText(label, x + labelPadding, y - labelHeight / 2 - 4);
        });
    }

    /**
     * Convert hex color to rgba
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Set anomalies data
     */
    setAnomalies(anomalies) {
        this.anomalies = anomalies;
        // Show all anomalies by default
        this.visibleAnomalies = new Set(anomalies.map(a => a.id));
        this.drawOverlay();
    }

    /**
     * Toggle anomaly visibility
     */
    toggleAnomaly(id) {
        if (this.visibleAnomalies.has(id)) {
            this.visibleAnomalies.delete(id);
        } else {
            this.visibleAnomalies.add(id);
        }
        this.drawOverlay();
        return this.visibleAnomalies.has(id);
    }

    /**
     * Show/hide all anomalies
     */
    toggleAllAnomalies(show) {
        if (show) {
            this.visibleAnomalies = new Set(this.anomalies.map(a => a.id));
        } else {
            this.visibleAnomalies.clear();
        }
        this.drawOverlay();
    }

    /**
     * Toggle overlay visibility
     */
    toggleOverlay() {
        this.showOverlay = !this.showOverlay;
        this.drawOverlay();
        return this.showOverlay;
    }

    /**
     * Handle mouse down
     */
    handleMouseDown(e) {
        if (e.button !== 0) return; // Left click only

        const rect = this.canvasContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.drawMode) {
            // Start selection
            this.isDrawing = true;
            this.selectionStart = { x, y };
            this.selectionBox.style.left = `${x}px`;
            this.selectionBox.style.top = `${y}px`;
            this.selectionBox.style.width = '0px';
            this.selectionBox.style.height = '0px';
            this.selectionBox.classList.remove('hidden');
            this.canvasContainer.classList.add('drawing');
        } else {
            // Start drag
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            this.canvasContainer.classList.add('grabbing');
        }
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;

            this.offsetX += dx;
            this.offsetY += dy;

            this.lastX = e.clientX;
            this.lastY = e.clientY;

            this.updateTransform();
        } else if (this.isDrawing && this.selectionStart) {
            const rect = this.canvasContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const left = Math.min(this.selectionStart.x, x);
            const top = Math.min(this.selectionStart.y, y);
            const width = Math.abs(x - this.selectionStart.x);
            const height = Math.abs(y - this.selectionStart.y);

            this.selectionBox.style.left = `${left}px`;
            this.selectionBox.style.top = `${top}px`;
            this.selectionBox.style.width = `${width}px`;
            this.selectionBox.style.height = `${height}px`;
        }
    }

    /**
     * Handle mouse up
     */
    handleMouseUp(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.canvasContainer.classList.remove('grabbing');
        } else if (this.isDrawing) {
            this.isDrawing = false;
            this.canvasContainer.classList.remove('drawing');
            this.selectionBox.classList.add('hidden');

            // Calculate selection area and zoom
            if (this.selectionStart) {
                const rect = this.canvasContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const selWidth = Math.abs(x - this.selectionStart.x);
                const selHeight = Math.abs(y - this.selectionStart.y);

                // Only zoom if selection is significant
                if (selWidth > 20 && selHeight > 20) {
                    this.zoomToSelection(
                        Math.min(this.selectionStart.x, x),
                        Math.min(this.selectionStart.y, y),
                        selWidth,
                        selHeight
                    );
                }
            }

            this.selectionStart = null;
            this.setDrawMode(false);
        }
    }

    /**
     * Handle wheel for zoom
     */
    handleWheel(e) {
        e.preventDefault();

        const rect = this.canvasContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const delta = -e.deltaY * 0.001;
        const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * (1 + delta)));

        if (newScale !== this.scale) {
            // Zoom towards mouse position
            const scaleRatio = newScale / this.scale;

            this.offsetX = mouseX - (mouseX - this.offsetX) * scaleRatio;
            this.offsetY = mouseY - (mouseY - this.offsetY) * scaleRatio;

            this.scale = newScale;
            this.updateTransform();
            this.updateZoomDisplay();
        }
    }

    /**
     * Zoom to selection area
     */
    zoomToSelection(x, y, width, height) {
        const containerRect = this.container.getBoundingClientRect();

        // Calculate the center of the selection in current transform
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Calculate scale to fit selection
        const scaleX = containerRect.width / width;
        const scaleY = containerRect.height / height;
        const newScale = Math.min(scaleX, scaleY, this.maxScale) * 0.9;

        // Convert selection center to image coordinates
        const imgCenterX = (centerX - this.offsetX) / this.scale;
        const imgCenterY = (centerY - this.offsetY) / this.scale;

        // Update scale
        this.scale = newScale;

        // Center the selection
        this.offsetX = containerRect.width / 2 - imgCenterX * this.scale;
        this.offsetY = containerRect.height / 2 - imgCenterY * this.scale;

        this.updateTransform();
        this.updateZoomDisplay();
    }

    /**
     * Update canvas transform
     */
    updateTransform() {
        this.canvasContainer.style.transform = `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    }

    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
        }
    }

    /**
     * Zoom in
     */
    zoomIn() {
        const newScale = Math.min(this.maxScale, this.scale * 1.25);
        this.zoomToCenter(newScale);
    }

    /**
     * Zoom out
     */
    zoomOut() {
        const newScale = Math.max(this.minScale, this.scale / 1.25);
        this.zoomToCenter(newScale);
    }

    /**
     * Zoom to center
     */
    zoomToCenter(newScale) {
        const containerRect = this.container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;

        const scaleRatio = newScale / this.scale;

        this.offsetX = centerX - (centerX - this.offsetX) * scaleRatio;
        this.offsetY = centerY - (centerY - this.offsetY) * scaleRatio;

        this.scale = newScale;
        this.updateTransform();
        this.updateZoomDisplay();
    }

    /**
     * Reset zoom and position
     */
    resetZoom() {
        this.fitToContainer();
    }

    /**
     * Set draw mode
     */
    setDrawMode(enabled) {
        this.drawMode = enabled;
        const btn = document.getElementById('drawModeBtn');
        if (btn) {
            btn.classList.toggle('active', enabled);
        }
        this.canvasContainer.style.cursor = enabled ? 'crosshair' : 'grab';
    }

    /**
     * Toggle draw mode
     */
    toggleDrawMode() {
        this.setDrawMode(!this.drawMode);
        return this.drawMode;
    }

    /**
     * Check if image is loaded
     */
    hasImage() {
        return this.image !== null;
    }

    /**
     * Clear viewer
     */
    clear() {
        this.image = null;
        this.anomalies = [];
        this.visibleAnomalies.clear();
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        this.imageCtx.clearRect(0, 0, this.imageCanvas.width, this.imageCanvas.height);
        this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

        this.updateTransform();
        this.updateZoomDisplay();
    }
}
