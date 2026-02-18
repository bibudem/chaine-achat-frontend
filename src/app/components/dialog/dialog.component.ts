import { Component, OnInit, OnDestroy } from '@angular/core';
import { DialogService, DialogConfig } from '../../services/dialog.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent implements OnInit, OnDestroy {
  isVisible = false;
  config: DialogConfig | null = null;
  private subscription?: Subscription;

  constructor(private dialogService: DialogService) {}

  ngOnInit(): void {
    this.subscription = this.dialogService.dialog$.subscribe((config) => {
      this.config = config;
      this.show();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  show(): void {
    this.isVisible = true;
    document.body.classList.add('modal-open');
  }

  hide(): void {
    this.isVisible = false;
    document.body.classList.remove('modal-open');
  }

  onConfirm(): void {
    this.dialogService.emitResult(true);
    this.hide();
  }

  onCancel(): void {
    this.dialogService.emitResult(false);
    this.hide();
  }
}