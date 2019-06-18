module.exports = {
    diff: function (p1, p2) {
        const dx = p2.lon - p1.lon;
        const dy = p2.lat - p1.lat;
        const dz = p2.relAlt - p1.relAlt;

        const rEarth = 6371000;
        const rad = Math.PI / 180;

        let x, y;

        if (dx !== 0) {
            y = dy * rad * rEarth;
        }

        if (dy !== 0) {
            const latRad = p1.lat * rad;
            x = dx * Math.cos(latRad) * rad * rEarth;
        }

        return {x:x, y:y, z:dz};
    },

    // Distance calculates the distance between two positions
    distance: function (p1, p2) {
        const d = this.diff(p1, p2);
        return Math.sqrt(d.x*d.x + d.y*d.y + d.z*d.z);
    }
};
