const { SeatingGrid, AllocationRule, Assignment, User, Registration } = require('../models');

// ──────────── SEATING GRID ────────────

// GET /api/allocation/:eventId/grid
const getGrid = async (req, res) => {
    try {
        const { eventId } = req.params;
        let grid = await SeatingGrid.findOne({ where: { event_id: eventId } });
        if (!grid) {
            grid = await SeatingGrid.create({ event_id: eventId });
        }
        res.json(grid);
    } catch (err) {
        console.error('getGrid error:', err);
        res.status(500).json({ message: 'Failed to fetch grid', error: err.message });
    }
};

// PUT /api/allocation/:eventId/grid
const updateGrid = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { rows, cols, blocked_cells, zone_map } = req.body;

        let grid = await SeatingGrid.findOne({ where: { event_id: eventId } });
        if (!grid) {
            grid = await SeatingGrid.create({ event_id: eventId, rows, cols, blocked_cells, zone_map });
        } else {
            if (grid.is_locked) {
                return res.status(400).json({ message: 'Grid is locked. Unlock first.' });
            }
            await grid.update({ rows, cols, blocked_cells, zone_map });
        }
        res.json(grid);
    } catch (err) {
        console.error('updateGrid error:', err);
        res.status(500).json({ message: 'Failed to update grid', error: err.message });
    }
};

// ──────────── ALLOCATION RULES ────────────

// GET /api/allocation/:eventId/rules
const getRules = async (req, res) => {
    try {
        const { eventId } = req.params;
        let rules = await AllocationRule.findOne({ where: { event_id: eventId } });
        if (!rules) {
            rules = await AllocationRule.create({ event_id: eventId });
        }
        res.json(rules);
    } catch (err) {
        console.error('getRules error:', err);
        res.status(500).json({ message: 'Failed to fetch rules', error: err.message });
    }
};

// PUT /api/allocation/:eventId/rules
const updateRules = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { mode, group_size, mix_branches, no_repeat_pairs, custom_constraints } = req.body;

        let rules = await AllocationRule.findOne({ where: { event_id: eventId } });
        if (!rules) {
            rules = await AllocationRule.create({ event_id: eventId, mode, group_size, mix_branches, no_repeat_pairs, custom_constraints });
        } else {
            if (rules.is_locked) {
                return res.status(400).json({ message: 'Rules are locked. Unlock first.' });
            }
            await rules.update({ mode, group_size, mix_branches, no_repeat_pairs, custom_constraints });
        }
        res.json(rules);
    } catch (err) {
        console.error('updateRules error:', err);
        res.status(500).json({ message: 'Failed to update rules', error: err.message });
    }
};

// ──────────── GENERATE & MANAGE ALLOCATIONS ────────────

// POST /api/allocation/:eventId/generate
const generate = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { day_number } = req.body;
        const result = await generateAllocations(parseInt(eventId), day_number || 1);
        res.json({ message: 'Allocations generated successfully', ...result });
    } catch (err) {
        console.error('generate error:', err);
        res.status(500).json({ message: 'Generation failed', error: err.message });
    }
};

// GET /api/allocation/:eventId/preview
const preview = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { day } = req.query;
        const dayNumber = parseInt(day) || 1;

        const assignments = await Assignment.findAll({
            where: { event_id: eventId, day_number: dayNumber },
            include: [{ model: User, attributes: ['id', 'name', 'branch', 'year', 'college', 'email'] }],
            order: [['group_name', 'ASC'], ['seat_row', 'ASC'], ['seat_col', 'ASC']],
        });

        const grid = await SeatingGrid.findOne({ where: { event_id: eventId } });

        // Group by team name
        const groups = {};
        for (const a of assignments) {
            if (!groups[a.group_name]) groups[a.group_name] = [];
            groups[a.group_name].push({
                user_id: a.user_id,
                name: a.User?.name,
                branch: a.User?.branch,
                year: a.User?.year,
                seat_row: a.seat_row,
                seat_col: a.seat_col,
                role: a.role,
                is_revealed: a.is_revealed,
            });
        }

        res.json({ groups, grid, totalAssignments: assignments.length });
    } catch (err) {
        console.error('preview error:', err);
        res.status(500).json({ message: 'Failed to load preview', error: err.message });
    }
};

// POST /api/allocation/:eventId/lock
const lock = async (req, res) => {
    try {
        const { eventId } = req.params;

        const count = await Assignment.count({ where: { event_id: eventId } });
        if (count === 0) {
            return res.status(400).json({ message: 'No assignments to lock. Generate first.' });
        }

        await AllocationRule.update({ is_locked: true }, { where: { event_id: eventId } });
        await SeatingGrid.update({ is_locked: true }, { where: { event_id: eventId } });

        res.json({ message: 'Allocations locked successfully', locked: true });
    } catch (err) {
        console.error('lock error:', err);
        res.status(500).json({ message: 'Failed to lock', error: err.message });
    }
};

// POST /api/allocation/:eventId/unlock
const unlock = async (req, res) => {
    try {
        const { eventId } = req.params;
        await AllocationRule.update({ is_locked: false }, { where: { event_id: eventId } });
        await SeatingGrid.update({ is_locked: false }, { where: { event_id: eventId } });
        res.json({ message: 'Allocations unlocked', locked: false });
    } catch (err) {
        console.error('unlock error:', err);
        res.status(500).json({ message: 'Failed to unlock', error: err.message });
    }
};

// ──────────── PARTICIPANT REVEAL ────────────

// GET /api/allocation/:eventId/reveal — participant reveals own assignment
const revealOwn = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user.id;
        const { day } = req.query;
        const dayNumber = parseInt(day) || 1;

        const assignment = await Assignment.findOne({
            where: { event_id: eventId, user_id: userId, day_number: dayNumber },
        });

        if (!assignment) {
            return res.status(404).json({ message: 'No assignment found for you in this event.' });
        }

        // Mark as revealed
        if (!assignment.is_revealed) {
            await assignment.update({ is_revealed: true });
        }

        res.json({
            group_name: assignment.group_name,
            seat_row: assignment.seat_row,
            seat_col: assignment.seat_col,
            role: assignment.role,
            day_number: assignment.day_number,
        });
    } catch (err) {
        console.error('revealOwn error:', err);
        res.status(500).json({ message: 'Failed to fetch assignment', error: err.message });
    }
};

// GET /api/allocation/:eventId/reveal/:userId — admin reveals for any participant
const revealForUser = async (req, res) => {
    try {
        const { eventId, userId } = req.params;
        const { day } = req.query;
        const dayNumber = parseInt(day) || 1;

        const assignment = await Assignment.findOne({
            where: { event_id: eventId, user_id: userId, day_number: dayNumber },
            include: [{ model: User, attributes: ['id', 'name', 'branch', 'year', 'college'] }],
        });

        if (!assignment) {
            return res.status(404).json({ message: 'No assignment found for this user.' });
        }

        // Mark as revealed
        if (!assignment.is_revealed) {
            await assignment.update({ is_revealed: true });
        }

        res.json({
            user: assignment.User,
            group_name: assignment.group_name,
            seat_row: assignment.seat_row,
            seat_col: assignment.seat_col,
            role: assignment.role,
            day_number: assignment.day_number,
        });
    } catch (err) {
        console.error('revealForUser error:', err);
        res.status(500).json({ message: 'Failed to fetch assignment', error: err.message });
    }
};

// GET /api/allocation/:eventId/participants — list participants for admin live reveal
const getParticipantsList = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { day } = req.query;
        const dayNumber = parseInt(day) || 1;

        // Find all approved registrations for this event
        const registrations = await Registration.findAll({
            where: { event_id: eventId, status: 'approved' },
            include: [
                { model: User, attributes: ['id', 'name', 'branch', 'year'] }
            ]
        });

        // Find existing assignments for this day
        const assignments = await Assignment.findAll({
            where: { event_id: eventId, day_number: dayNumber }
        });
        const assignmentMap = {};
        for (const a of assignments) {
            assignmentMap[a.user_id] = a;
        }

        const list = registrations.map(r => {
            const assignment = assignmentMap[r.user_id];
            return {
                user_id: r.user_id,
                name: r.User?.name,
                branch: r.User?.branch,
                year: r.User?.year,
                group_name: assignment ? assignment.group_name : null,
                is_revealed: assignment ? assignment.is_revealed : false,
            };
        });

        res.json(list);
    } catch (err) {
        console.error('getParticipantsList error:', err);
        res.status(500).json({ message: 'Failed to load participants', error: err.message });
    }
};

// POST /api/allocation/:eventId/assign-single/:userId
const assignSingleParticipant = async (req, res) => {
    try {
        const { eventId, userId } = req.params;
        const { day_number } = req.body;
        const dayNum = parseInt(day_number) || 1;

        // 1. Verify Registration
        const registration = await Registration.findOne({
            where: { event_id: eventId, user_id: userId, status: 'approved' },
            include: [{ model: User, attributes: ['id', 'name', 'branch', 'year'] }]
        });
        if (!registration) {
            return res.status(404).json({ message: 'User is not approved for this event.' });
        }

        // 2. Fetch Rules and Grid
        const rules = await AllocationRule.findOne({ where: { event_id: eventId } });
        const grid = await SeatingGrid.findOne({ where: { event_id: eventId } });
        if (!rules || !grid) {
            return res.status(400).json({ message: 'Must configure rules and grid first.' });
        }

        // 3. Current Assignments
        const allAssignments = await Assignment.findAll({ where: { event_id: eventId, day_number: dayNum } });
        
        // Remove this user's assignment if re-rolling
        await Assignment.destroy({ where: { event_id: eventId, user_id: userId, day_number: dayNum }});
        
        const otherAssignments = allAssignments.filter(a => a.user_id !== parseInt(userId));

        // 4. Calculate available seats
        const { rows, cols, blocked_cells = [] } = grid;
        let allSeats = [];
        for (let r = 1; r <= rows; r++) {
            for (let c = 1; c <= cols; c++) {
                const blocked = blocked_cells.some(cell => cell.row === r && cell.col === c);
                if (!blocked) allSeats.push({ row: r, col: c });
            }
        }
        
        // Remove taken seats
        const takenSeats = new Set(otherAssignments.map(a => `${a.seat_row}-${a.seat_col}`));
        let availableSeats = allSeats.filter(s => !takenSeats.has(`${s.row}-${s.col}`));
        
        let assignedSeat = { row: null, col: null };
        if (availableSeats.length > 0) {
            assignedSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
        }

        // 5. Determine Group
        const totalApproved = await Registration.count({ where: { event_id: eventId, status: 'approved' } });
        const targetGroupsCount = Math.ceil(totalApproved / (rules.group_size || 4)) || 1;
        
        const TEAM_PULL = [
            'Team Phoenix', 'Squad Neon', 'Cluster Vortex', 'Neural Net', 'Cyber Syndicate',
            'Data Ghosts', 'Synth Wave', 'Void Runners', 'Quantum Core', 'Glitch Mob',
            'Neon Tigers', 'Byte Masters', 'Code Walkers', 'Tech Nomads', 'Pixel Punks',
            'Grid Crashers', 'Data Miners', 'Hexagon Logic', 'Zero Day', 'System Override'
        ];
        
        const activeGroupNames = TEAM_PULL.slice(0, targetGroupsCount);
        const groupCounts = {};
        activeGroupNames.forEach(name => groupCounts[name.toUpperCase()] = 0);
        
        otherAssignments.forEach(a => {
            if (groupCounts[a.group_name] !== undefined) {
                groupCounts[a.group_name]++;
            }
        });

        const availableGroups = activeGroupNames.map(g => g.toUpperCase()).filter(name => groupCounts[name] < (rules.group_size || 4));
        
        let assignedGroup = 'INDEPENDENT';
        if (availableGroups.length > 0) {
            assignedGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
        } else {
            assignedGroup = activeGroupNames[Math.floor(Math.random() * activeGroupNames.length)].toUpperCase();
        }

        // 6. Role
        const ROLES = ['LEADER', 'SCRIBE', 'PRESENTER', 'ANALYST', 'STRATEGIST', 'OBSERVER'];
        const assignedRole = ROLES[Math.floor(Math.random() * Math.min(ROLES.length, rules.group_size || 4))];

        // 7. Create Assignment
        const newAssignment = await Assignment.create({
            event_id: eventId,
            user_id: userId,
            day_number: dayNum,
            group_name: assignedGroup,
            seat_row: assignedSeat.row,
            seat_col: assignedSeat.col,
            role: assignedRole,
            is_revealed: true // revealed by the gamified UI
        });

        res.json({
            ...newAssignment.toJSON(),
            user: registration.User
        });

    } catch (err) {
        console.error('assignSingleParticipant error:', err);
        res.status(500).json({ message: 'Failed to assign participant', error: err.message });
    }
};

module.exports = {
    getGrid,
    updateGrid,
    getRules,
    updateRules,
    generate,
    preview,
    lock,
    revealOwn,
    revealForUser,
    getParticipantsList,
    assignSingleParticipant,
};
