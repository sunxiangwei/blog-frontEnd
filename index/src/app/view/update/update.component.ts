import {Component, OnInit} from '@angular/core';
import {ApiService} from '../../api/api.service';
import {Title} from '@angular/platform-browser';

@Component({
    selector: 'view-update',
    templateUrl: './update.component.html',
    styleUrls: ['./update.component.less']
})
export class UpdateComponent implements OnInit {

    constructor(private titleService: Title,
                private apiService: ApiService) {
        titleService.setTitle('小海博客 | 网站更新记录');
    }

    lastUpdateTime: string;
    webUpdate: { id: number, info: string, time: string }[] = [];

    ngOnInit() {
        this.apiService.lastestUpdateTime().subscribe(data => {
            this.lastUpdateTime = data.result;
        });
        this.apiService.webUpdate().subscribe(data => {
            this.webUpdate = data.result.reverse();
        });
    }

}
