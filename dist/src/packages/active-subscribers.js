"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeSubscribersWhere = activeSubscribersWhere;
const guest_identity_service_1 = require("../auth/guest-identity.service");
function activeSubscribersWhere(now = new Date()) {
    return {
        isPremium: true,
        OR: [{ premiumExpiresAt: null }, { premiumExpiresAt: { gt: now } }],
        NOT: { email: { endsWith: guest_identity_service_1.GUEST_EMAIL_SUFFIX } },
    };
}
//# sourceMappingURL=active-subscribers.js.map