/**
 * AllocationEngine.js — Constraint-Based Allocation Solver
 * 
 * Assigns participants to groups, seats, and roles using a weighted scoring
 * algorithm that maximizes diversity and avoids repeat assignments.
 */

const { User, Registration, Assignment, SeatingGrid, AllocationRule } = require('../models');
const { Op } = require('sequelize');

// Pool of cyberpunk team names
const TEAM_NAMES = [
    'Team Phoenix', 'Squad Neon', 'Cluster Vortex', 'Cell Cipher',
    'Grid Phantom', 'Node Apex', 'Core Ember', 'Arc Nebula',
    'Sync Pulse', 'Byte Storm', 'Hex Radiant', 'Unit Spectra',
    'Link Prism', 'Wave Zenith', 'Zone Cobalt', 'Ring Aether',
    'Forge Titan', 'Edge Nova', 'Flux Sigma', 'Drift Vector',
    'Orbit Blaze', 'Axis Omega', 'Shard Echo', 'Vault Chronos',
    'Rune Vertex', 'Hive Quasar', 'Deck Inferno', 'Crux Astral',
    'Bolt Horizon', 'Mesa Glitch',
];

const ROLES = ['Leader', 'Scribe', 'Presenter', 'Analyst', 'Strategist', 'Observer'];

/**
 * Fisher-Yates shuffle — returns a new shuffled copy
 */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Compute a diversity score for adding a participant to a candidate group
 * Higher = better match
 */
function scorePlacement(participant, group, previousPairs, rules) {
    let score = 0;

    // Rule: Maximize branch diversity
    if (rules.mix_branches) {
        const branchesInGroup = new Set(group.map(m => m.branch));
        if (!branchesInGroup.has(participant.branch)) {
            score += 10; // New branch = big bonus
        }
    }

    // Year diversity bonus
    const yearsInGroup = new Set(group.map(m => m.year));
    if (!yearsInGroup.has(participant.year)) {
        score += 5;
    }

    // Rule: No repeat pairs from previous days
    if (rules.no_repeat_pairs) {
        const hasRepeat = group.some(member => {
            const pairKey = [participant.id, member.id].sort().join('-');
            return previousPairs.has(pairKey);
        });
        if (!hasRepeat) {
            score += 20; // No repeats = big bonus
        } else {
            score -= 30; // Penalize heavily
        }
    }

    // Small random factor to avoid deterministic ties
    score += Math.random() * 2;

    return score;
}

/**
 * Build a set of all previous pair keys for the given event (across all days)
 */
async function getPreviousPairs(eventId, currentDay) {
    const prevAssignments = await Assignment.findAll({
        where: {
            event_id: eventId,
            day_number: { [Op.lt]: currentDay },
        },
        attributes: ['user_id', 'group_name', 'day_number'],
    });

    const pairSet = new Set();

    // Group assignments by day+group_name, then generate all pairs within each group
    const dayGroups = {};
    for (const a of prevAssignments) {
        const key = `${a.day_number}::${a.group_name}`;
        if (!dayGroups[key]) dayGroups[key] = [];
        dayGroups[key].push(a.user_id);
    }

    for (const members of Object.values(dayGroups)) {
        for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
                pairSet.add([members[i], members[j]].sort().join('-'));
            }
        }
    }

    return pairSet;
}

/**
 * Main entry point — generate allocations for an event+day
 */
async function generateAllocations(eventId, dayNumber = 1) {
    // 1. Load the rules for this event
    let rules = await AllocationRule.findOne({ where: { event_id: eventId } });
    if (!rules) {
        // Create default rules if none exist
        rules = await AllocationRule.create({ event_id: eventId });
    }

    if (rules.is_locked) {
        throw new Error('Allocations are locked for this event. Unlock first to regenerate.');
    }

    // 2. Determine group size based on mode
    let groupSize = rules.group_size;
    if (rules.mode === 'pair') groupSize = 2;
    if (rules.mode === 'squad') groupSize = Math.max(groupSize, 6);

    // 3. Load approved participants for this event
    const registrations = await Registration.findAll({
        where: { event_id: eventId, status: 'approved' },
        include: [{ model: User, attributes: ['id', 'name', 'branch', 'year', 'college'] }],
    });

    const participants = registrations
        .filter(r => r.User)
        .map(r => ({
            id: r.User.id,
            name: r.User.name,
            branch: r.User.branch || 'Unknown',
            year: r.User.year || 'Unknown',
            college: r.User.college || 'Unknown',
        }));

    if (participants.length === 0) {
        throw new Error('No approved participants found for this event.');
    }

    // 4. Load previous pair history (for no-repeat constraint)
    const previousPairs = await getPreviousPairs(eventId, dayNumber);

    // 5. Delete any existing assignments for this event+day (re-generate)
    await Assignment.destroy({
        where: { event_id: eventId, day_number: dayNumber },
    });

    // 6. Form groups using weighted scoring
    const shuffled = shuffle(participants);
    const numGroups = Math.ceil(shuffled.length / groupSize);
    const groups = Array.from({ length: numGroups }, () => []);

    // Assign each participant to the best-scoring group
    for (const participant of shuffled) {
        let bestGroupIdx = 0;
        let bestScore = -Infinity;

        for (let g = 0; g < numGroups; g++) {
            // Skip full groups
            if (groups[g].length >= groupSize) continue;

            const score = scorePlacement(participant, groups[g], previousPairs, rules);
            if (score > bestScore) {
                bestScore = score;
                bestGroupIdx = g;
            }
        }

        groups[bestGroupIdx].push(participant);
    }

    // 7. Load seating grid (if configured)
    let grid = await SeatingGrid.findOne({ where: { event_id: eventId } });
    const blockedCells = grid ? grid.blocked_cells : [];
    const blockedSet = new Set(blockedCells.map(c => `${c.row}-${c.col}`));

    // Build available seats (if grid exists)
    let availableSeats = [];
    if (grid) {
        for (let r = 1; r <= grid.rows; r++) {
            for (let c = 1; c <= grid.cols; c++) {
                if (!blockedSet.has(`${r}-${c}`)) {
                    availableSeats.push({ row: r, col: c });
                }
            }
        }
    }

    // 8. Generate assignments
    const assignments = [];
    let seatIdx = 0;
    const teamNames = shuffle(TEAM_NAMES);

    for (let g = 0; g < groups.length; g++) {
        const groupName = teamNames[g % teamNames.length];

        for (let m = 0; m < groups[g].length; m++) {
            const member = groups[g][m];
            const role = ROLES[m % ROLES.length];

            let seatRow = null;
            let seatCol = null;
            if (seatIdx < availableSeats.length) {
                seatRow = availableSeats[seatIdx].row;
                seatCol = availableSeats[seatIdx].col;
                seatIdx++;
            }

            assignments.push({
                event_id: eventId,
                user_id: member.id,
                day_number: dayNumber,
                group_name: groupName,
                seat_row: seatRow,
                seat_col: seatCol,
                role: role,
                is_revealed: false,
            });
        }
    }

    // 9. Bulk insert
    await Assignment.bulkCreate(assignments);

    return {
        totalParticipants: participants.length,
        totalGroups: groups.length,
        groupSize,
        assignments: assignments.map(a => ({
            user_id: a.user_id,
            group_name: a.group_name,
            seat_row: a.seat_row,
            seat_col: a.seat_col,
            role: a.role,
        })),
    };
}

module.exports = { generateAllocations };
