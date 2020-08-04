import db from '.././database/conections';
import convertHourToMinute from '.././utils/convertHourToMinute';
import {Request, Response} from 'express';

interface ScheduleItem {
    week_day: number;
    from: string;
    to: string;
}

export default class ClassesControler {
    async index(request: Request, response: Response) {
        const filters = request.query;

        const subject = filters.subject as string;
        const time = filters.time as string;
        const week_day = filters.week_day as string;

        if(!filters.week_day || !filters.subject || !filters.time) {
            return response.status(400).json({
                error: "Missing filters to search classes",
            });
        }

        const timeInMinutes = convertHourToMinute(time);
        
        const classes = await db('classes')
            .whereExists(function() {
                this.select('class_schedule.*').from('class_schedule')
                .whereRaw('`class_schedule`. `class_id` = `classes`.`id`')
                .whereRaw('`class_schedule`.`week_day` = ??', [Number(week_day)])
                .whereRaw('`class_schedule`.`from` <= ??', [timeInMinutes])
                .whereRaw('`class_schedule`.`to` > ??', [timeInMinutes])
            })
            .where('classes.subject', '=', subject)
            .join('users', 'classes.user_id', '=', 'user_id')
            .select(['classes.*', 'users.*']);

        return response.json(classes);
    }

    async create(request: Request, response: Response) {
        const {
            name, avatar, whatsapp, bio,
            subject, cost, schedule
        } = request.body;
    
        const transaction = await db.transaction();
    
        try {
            const insertedUserIds = await transaction('users').insert({
                name,
                avatar,
                whatsapp,
                bio,
            });
        
            const user_id = insertedUserIds[0];
        
            const insertedClassesIds = await transaction('classes').insert({
                subject,
                cost,
                user_id,
            });
        
            const class_id = insertedClassesIds[0];
        
            const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
                return {
                    class_id,
                    week_day: scheduleItem.week_day,
                    from: convertHourToMinute(scheduleItem.from),
                    to: convertHourToMinute(scheduleItem.to),
                };
            })
        
            await transaction('class_schedule').insert(classSchedule);
        
            await transaction.commit();
        } catch(err) {
            await transaction.rollback();
    
            return response.status(500).json({
                error: "Unexpected error while creating new class"
            })
        }
    
        return response.status(201).send();
    }
}