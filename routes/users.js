const User = require('../models/user');
const Task = require('../models/task');
const { buildQueryParams } = require('../routes/helpers/queryBuilder.js');

module.exports = function (router) {
    const usersRoute =  router.route('/users');
    const usersIdRoute = router.route('/users/:id');

    usersRoute.get(async (req, res) => {
        try {
            const { where, sort, select, skip, limit, count } = buildQueryParams(req, 0);

            if (count) {
            const total = await User.countDocuments(where);
            return res.status(200).json({ message: 'OK', data: total });
            }

            const query = User.find(where)
            .sort(sort)
            .select(select)
            .skip(skip);

            if (limit > 0) query.limit(limit);

            const users = await query;
            res.status(200).json({ message: 'OK', data: users });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
        });
    //Users cannot be created with lists of task to guarantee two-way reference.
    usersRoute.post(async (req, res) => {
            try {
                const { name, email } = req.body;
                if (!name || !email) {
                    return res.status(400).json({ message: 'Missing name or email', data: null });
                }

                const user = new User({ name, email });
                const savedUser = await user.save();
                res.status(201).json({ message: 'User created', data: savedUser });
            } catch (err) {
                if (err.code === 11000) {
                    res.status(400).json({ message: 'Email must be unique', data: null });
                } else {
                    res.status(500).json({ message: 'Server error', data: err });
                }
            }
        });


    usersIdRoute.get(async (req, res) => {
        try {
            const { select } = buildQueryParams(req);
            const user = await User.findById(req.params.id).select(select);

            if (!user) return res.status(404).json({ message: 'Task not found' });
            res.status(200).json({ message: 'OK', data: user });
        } catch (err) {
            res.status(500).json({ message: 'Server error', data: err.message });
        }
        });
    usersIdRoute.put(async (req, res) => {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: 'User not found' });

            const oldPendingTasks = user.pendingTasks.map(id => id.toString());
            const { name, email, pendingTasks, dateCreated } = req.body;

            if (name !== undefined) user.name = name;
            if (email !== undefined) user.email = email;
            if (dateCreated !== undefined) user.dateCreated = dateCreated;

            if (pendingTasks) {
            // remove duplicates from request input
            const newPendingTasks = [...new Set(pendingTasks.map(id => id.toString()))];

            // Find removed tasks (tasks no longer in the user's list)
            const removedTasks = oldPendingTasks.filter(id => !newPendingTasks.includes(id));

            for (const taskId of removedTasks) {
                const task = await Task.findById(taskId);
                if (task && task.assignedUser === userId) {
                task.assignedUser = '';
                task.assignedUserName = 'unassigned';
                await task.save();
                }
            }

            // Find newly added tasks (tasks that were not previously in the list)
            const addedTasks = newPendingTasks.filter(id => !oldPendingTasks.includes(id));

            for (const taskId of addedTasks) {
                const task = await Task.findById(taskId);
                if (!task) return res.status(400).json({ message: `Task ${taskId} not found` });

                // If task was previously assigned to someone else, fix that user's pendingTasks
                if (task.assignedUser && task.assignedUser.toString() !== userId.toString()) {
                const oldUser = await User.findById(task.assignedUser);
                if (oldUser) {
                    oldUser.pendingTasks = oldUser.pendingTasks.filter(
                    id => id.toString() !== task._id.toString()
                    );
                    await oldUser.save();
                }
                }

                // Assign task to this user
                task.assignedUser = userId;
                task.assignedUserName = user.name;
                await task.save();
            }

            // Finally, ensure pendingTasks has unique IDs
            user.pendingTasks = [...new Set(newPendingTasks)];
            }

            await user.save();

            res.status(200).json({ message: 'OK', data: user });

        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error', data: err.message });
        }
        });
    usersIdRoute.delete(async (req, res) => {
        try {
        const userId = req.params.id;


        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });


        const tasks = await Task.find({ assignedUser: userId });
        for (const task of tasks) {
            task.assignedUser = '';
            task.assignedUserName = 'unassigned';
            await task.save();
        }


        await User.findByIdAndDelete(userId);

        res.status(204).json({message: 'OK', data:{}});

        } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', data: err });
        }
    });

    return router;
};