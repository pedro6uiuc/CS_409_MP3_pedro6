const User = require('../models/user');
const Task = require('../models/task');

module.exports = function (router) {
    const usersRoute =  router.route('/users');
    const usersIdRoute = router.route('/users/:id');
    usersRoute.get(async (req, res) => {
            try {
                const users = await User.find();
                res.status(200).json({ message: 'OK', data: users });
            } catch (err) {
                res.status(500).json({ message: 'Server error', data: err });
            }
        })
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
                const user = await User.findById(req.params.id);
                if (!user) return res.status(404).json({ message: 'User not found', data: null });
                res.status(200).json({ message: 'OK', data: user });
            } catch (err) {
                res.status(500).json({ message: 'Server error', data: err });
            }
        })
    usersIdRoute.put(async (req, res) => {
        try {
        const userId = req.params.id;


        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const oldPendingTasks = user.pendingTasks.map(id => id.toString());


        const { name, email, pendingTasks, completedTasks } = req.body;

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;

        if (pendingTasks) {

            const newPendingTasks = pendingTasks.map(id => id.toString());

            const removedTasks = oldPendingTasks.filter(
            id => !newPendingTasks.includes(id)
            );

            for (const taskId of removedTasks) {
            const task = await Task.findById(taskId);
            if (task && task.assignedUser === userId) {
                task.assignedUser = '';
                task.assignedUserName = 'unassigned';
                await task.save();
            }
            }


            const addedTasks = newPendingTasks.filter(
            id => !oldPendingTasks.includes(id)
            );

            for (const taskId of addedTasks) {
            const task = await Task.findById(taskId);
            if (!task) return res.status(400).json({ message: `Task ${taskId} not found` });

            if (task.assignedUser && task.assignedUser !== userId) {
                const oldUser = await User.findById(task.assignedUser);
                if (oldUser) {
                oldUser.pendingTasks = oldUser.pendingTasks.filter(
                    id => id.toString() !== task._id.toString()
                );
                await oldUser.save();
                }
            }

            task.assignedUser = userId;
            task.assignedUserName = user.name;
            await task.save();
            }

            user.pendingTasks = newPendingTasks;
        }

        if (completedTasks) {
            user.completedTasks = completedTasks;
        }
        await user.save();

        res.status(200).json({message:'Ok',data: user});

        } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', data: err });
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

        res.status(204).send();

        } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', data: err });
        }
    });

    return router;
};