"use client";

import * as React from "react";
import {
  ArrowRight,
  Bell,
  Check,
  Command,
  Copy,
  Heart,
  Layers,
  Loader,
  Mail,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Trash2,
} from "lucide-react";

import {
  Accordion,
  AccordionItem,
  AutoAnimate,
  Button,
  Callout,
  Card,
  Cluster,
  Combobox,
  ComboboxItem,
  Dialog,
  DialogTrigger,
  Dot,
  Field,
  Heading,
  IconButton,
  Input,
  Kicker,
  Magnetic,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
  PopoverTrigger,
  Press,
  Progress,
  Reveal,
  Select,
  SelectItem,
  SectionHeader,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  Text,
  Textarea,
  Tooltip,
  TooltipTrigger,
  toast,
  useMotiveUI,
} from "@motive/ds";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function DesignSystemShowcase() {
  const density = useMotiveUI((state) => state.density);
  const setDensity = useMotiveUI((state) => state.setDensity);

  const [progress, setProgress] = React.useState(34);
  const [list, setList] = React.useState(["Reach", "Conversions", "Brand lift"]);

  return (
    <main className="app-main grid grid-cols-1 gap-10">
      {/* ────────────────────────── Header ────────────────────────── */}
      <Reveal>
        <Card variant="feature">
          <Cluster justify="between" wrap>
            <Stack gap={3}>
              <Kicker>Motive Design System</Kicker>
              <Heading level={1}>Apple-tier primitives, RAC accessibility</Heading>
              <Text variant="lede" className="max-w-2xl">
                Every primitive routes through React Aria Components so keyboard,
                screen-reader, focus-visible, hovered, pressed, and disabled states
                are part of the contract — then we add spring physics, sheen,
                shimmer, and shake on top.
              </Text>
            </Stack>
            <Cluster gap={3} align="center">
              <Tag tone="cyan">v1 surface</Tag>
              <Switch
                isSelected={density === "compact"}
                onChange={(checked) => setDensity(checked ? "compact" : "comfortable")}
                label="Compact density"
                description="Persisted via zustand + localStorage."
              />
            </Cluster>
          </Cluster>
        </Card>
      </Reveal>

      {/* ──────────────────────── Buttons ─────────────────────── */}
      <Reveal delay={60}>
        <Card>
          <SectionHeader
            kicker="Buttons"
            title="Every state, every interaction"
            lede="Idle, hover, pressed, focus-visible, loading, disabled, success pulse, error shake. Drive async state with onPressAsync or useAsyncAction."
          />
          <Stack gap={6} className="mt-6">
            <Cluster gap={3} wrap>
              <Button iconRight={<ArrowRight className="arr" size={16} />}>Primary</Button>
              <Button variant="ghost" iconLeft={<Sparkles size={16} />}>Ghost</Button>
              <Button variant="ghostDark">Ghost dark</Button>
              <Button variant="quiet">Quiet</Button>
              <Button variant="success" iconLeft={<Check size={16} />}>Success</Button>
              <Button variant="danger" iconLeft={<Trash2 size={16} />}>Danger</Button>
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </Cluster>

            <Cluster gap={3} wrap align="center">
              <Button size="sm">Small</Button>
              <Button>Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl" iconRight={<ArrowRight className="arr" size={18} />}>
                Extra large
              </Button>
            </Cluster>

            <Cluster gap={3} wrap align="center">
              <TooltipTrigger>
                <IconButton aria-label="Add" icon={<Plus size={16} />} />
                <Tooltip>Add a new item ⌘N</Tooltip>
              </TooltipTrigger>
              <TooltipTrigger>
                <IconButton variant="ghost" aria-label="Settings" icon={<Settings size={16} />} />
                <Tooltip>Workspace settings</Tooltip>
              </TooltipTrigger>
              <TooltipTrigger>
                <IconButton variant="ghostDark" aria-label="Copy" icon={<Copy size={16} />} />
                <Tooltip>Copy snippet</Tooltip>
              </TooltipTrigger>
              <TooltipTrigger>
                <IconButton variant="quiet" aria-label="Like" icon={<Heart size={16} />} />
                <Tooltip>Save to favorites</Tooltip>
              </TooltipTrigger>

              <Magnetic strength={0.3}>
                <Button size="lg" iconRight={<ArrowRight className="arr" size={18} />}>
                  Magnetic CTA
                </Button>
              </Magnetic>
            </Cluster>

            <Cluster gap={3} wrap>
              <Button
                onPressAsync={async () => {
                  await sleep(900);
                  toast.success("Saved to workspace");
                }}
                iconLeft={<Sparkles size={16} />}
              >
                Async → success
              </Button>
              <Button
                variant="ghost"
                onPressAsync={async () => {
                  await sleep(700);
                  throw new Error("Bad request");
                }}
                iconLeft={<Loader size={16} />}
              >
                Async → error shake
              </Button>
              <Button
                variant="danger"
                onPress={() => toast.error("Deletion requires confirmation")}
              >
                Toast (error)
              </Button>
              <Button
                variant="ghostDark"
                onPress={() => toast("Daily digest queued", { description: "Delivers tomorrow at 9am UTC" })}
              >
                Toast (info)
              </Button>
            </Cluster>
          </Stack>
        </Card>
      </Reveal>

      {/* ──────────────────────── Form controls ───────────────────── */}
      <Reveal delay={120}>
        <Card>
          <SectionHeader
            kicker="Inputs"
            title="Form controls with full RAC state"
            lede="Inputs expose data-focused, data-hovered, data-invalid, data-disabled. Field wires label + hint + error via aria-describedby and aria-errormessage."
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mt-6">
            <Field label="Workspace name" hint="Visible across the team.">
              <Input placeholder="motive.ai" />
            </Field>
            <Field label="Slug" error="That handle is taken." defaultValue="motive">
              <Input invalid placeholder="motive" />
            </Field>
            <Field label="Notes">
              <Textarea placeholder="What should we know?" />
            </Field>
            <div className="grid grid-cols-1 gap-4">
              <Select label="Channel" placeholder="Pick a channel">
                <SelectItem id="meta">Meta</SelectItem>
                <SelectItem id="google">Google</SelectItem>
                <SelectItem id="tiktok">TikTok</SelectItem>
                <SelectItem id="ooh">Out-of-home</SelectItem>
              </Select>
              <Combobox label="Country" placeholder="Search…">
                <ComboboxItem id="fr">France</ComboboxItem>
                <ComboboxItem id="us">United States</ComboboxItem>
                <ComboboxItem id="jp">Japan</ComboboxItem>
                <ComboboxItem id="br">Brazil</ComboboxItem>
              </Combobox>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* ─────────────────────── Overlays + menus ────────────────── */}
      <Reveal delay={180}>
        <Card>
          <SectionHeader
            kicker="Overlays"
            title="Dialog, Popover, Menu, Tooltip"
            lede="All entry/exit animations are spring-driven and overlay uses iOS-style blurred glass."
          />
          <Cluster gap={3} wrap className="mt-6">
            <DialogTrigger>
              <Button>Open dialog</Button>
              <Dialog
                title="Approve creative variant"
                description="This will mark the variant ready for deploy and notify the reviewer."
                footer={
                  <>
                    <Button variant="quiet" slot="close">Cancel</Button>
                    <Button
                      onPressAsync={async () => {
                        await sleep(800);
                        toast.success("Variant approved");
                      }}
                      iconLeft={<Check size={16} />}
                    >
                      Approve
                    </Button>
                  </>
                }
              >
                <Stack gap={3}>
                  <Text>
                    You can change this decision later from the review history. The
                    audit log will record this action with your user id.
                  </Text>
                  <Callout>
                    <Cluster gap={2} align="center">
                      <Dot pulse />
                      <Text variant="caption">Realtime listeners will refresh in 1.2s</Text>
                    </Cluster>
                  </Callout>
                </Stack>
              </Dialog>
            </DialogTrigger>

            <PopoverTrigger>
              <Button variant="ghost" iconLeft={<Bell size={16} />}>Notifications</Button>
              <Popover>
                <Stack gap={3} className="p-3 min-w-72">
                  <Heading level={4}>Inbox</Heading>
                  <Text variant="caption">3 new updates since you were away.</Text>
                  <Stack gap={2}>
                    {["Deploy completed", "New review pending", "KPI snapshot ready"].map((label) => (
                      <Cluster key={label} gap={2} align="center">
                        <Dot />
                        <Text>{label}</Text>
                      </Cluster>
                    ))}
                  </Stack>
                </Stack>
              </Popover>
            </PopoverTrigger>

            <MenuTrigger>
              <Button variant="ghostDark" iconLeft={<Command size={14} />}>Actions</Button>
              <Menu>
                <MenuItem icon={<Mail size={14} />} shortcut="⌘M">Send via email</MenuItem>
                <MenuItem icon={<Copy size={14} />} shortcut="⌘C">Copy link</MenuItem>
                <MenuItem icon={<Sun size={14} />}>Make brighter</MenuItem>
                <MenuItem icon={<Moon size={14} />}>Make dimmer</MenuItem>
                <MenuItem tone="danger" icon={<Trash2 size={14} />}>Delete forever</MenuItem>
              </Menu>
            </MenuTrigger>

            <TooltipTrigger>
              <IconButton aria-label="Layers" icon={<Layers size={16} />} variant="ghost" />
              <Tooltip>Open layers panel</Tooltip>
            </TooltipTrigger>
          </Cluster>
        </Card>
      </Reveal>

      {/* ──────────────────────── Tabs ──────────────────────────── */}
      <Reveal delay={240}>
        <Card>
          <SectionHeader
            kicker="Tabs"
            title="Sliding indicator (layoutId)"
            lede="The pill morphs between tabs via motion's shared layout — RAC handles keyboard + roving tabindex."
          />
          <Tabs defaultSelectedKey="overview" className="mt-6">
            <TabList aria-label="Workbench tabs">
              <Tab id="overview">Overview</Tab>
              <Tab id="extraction">Extraction</Tab>
              <Tab id="review">Review</Tab>
              <Tab id="creatives">Creatives</Tab>
              <Tab id="deploy">Deploy</Tab>
            </TabList>
            <TabPanel id="overview">
              <Text className="mt-4">Project at a glance — KPIs, status, last activity.</Text>
            </TabPanel>
            <TabPanel id="extraction">
              <Text className="mt-4">Stream phases as they complete.</Text>
            </TabPanel>
            <TabPanel id="review">
              <Text className="mt-4">Approve, edit, or reject every extracted row.</Text>
            </TabPanel>
            <TabPanel id="creatives">
              <Text className="mt-4">Generated images and copy per ad group.</Text>
            </TabPanel>
            <TabPanel id="deploy">
              <Text className="mt-4">Simulated rollout + story-tied monitoring.</Text>
            </TabPanel>
          </Tabs>
        </Card>
      </Reveal>

      {/* ──────────────────── Feedback + Progress ─────────────────── */}
      <Reveal delay={300}>
        <Card>
          <SectionHeader
            kicker="Feedback"
            title="Progress, Slider, Skeleton, Spinner"
            lede="Loading is never a static spinner — gradients, shimmer, and motion are all baked in."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
            <Stack gap={3}>
              <Progress label="Generating ad groups" value={progress} />
              <Cluster gap={2}>
                <Button size="sm" variant="ghost" onPress={() => setProgress((value) => Math.max(0, value - 12))}>−12</Button>
                <Button size="sm" variant="ghost" onPress={() => setProgress((value) => Math.min(100, value + 12))}>+12</Button>
                <Button size="sm" variant="quiet" onPress={() => setProgress(0)}>Reset</Button>
              </Cluster>
              <Progress label="Streaming phases" isIndeterminate />
            </Stack>

            <Stack gap={4}>
              <Slider
                label="Budget cap"
                defaultValue={3200}
                minValue={500}
                maxValue={10000}
                step={50}
                formatOptions={{ style: "currency", currency: "USD", maximumFractionDigits: 0 }}
              />
              <Slider
                label="Audience range"
                defaultValue={[18, 49]}
                minValue={13}
                maxValue={65}
              />
            </Stack>

            <Stack gap={3}>
              <Cluster gap={3} align="center">
                <Spinner />
                <Spinner size="lg" />
                <Text variant="caption">Spinner — sm + lg</Text>
              </Cluster>
              <Stack gap={2}>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </Stack>
              <Cluster gap={3} align="center">
                <Skeleton shape="circle" width={36} height={36} />
                <Stack gap={2} className="flex-1">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </Stack>
              </Cluster>
            </Stack>

            <Accordion>
              <AccordionItem title="Why React Aria Components?">
                Out-of-the-box keyboard, screen-reader, and focus management. We
                add the visual layer and spring physics on top.
              </AccordionItem>
              <AccordionItem title="How are server states managed?">
                TanStack Query owns server state with stale-while-revalidate
                semantics; mutations invalidate by tag.
              </AccordionItem>
              <AccordionItem title="What about client state?">
                Zustand stores small, intentional UI state (density, command
                palette, highlight target) — persisted where it matters.
              </AccordionItem>
            </Accordion>
          </div>
        </Card>
      </Reveal>

      {/* ──────────────────── Auto animate + Press ──────────────── */}
      <Reveal delay={360}>
        <Card>
          <SectionHeader
            kicker="Layout motion"
            title="AutoAnimate + Press"
            lede="Lists FLIP without ceremony; cards spring under touch."
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
            <Stack gap={3}>
              <Cluster gap={2}>
                <Button
                  size="sm"
                  iconLeft={<Plus size={14} />}
                  onPress={() => setList((prev) => [...prev, `Goal ${prev.length + 1}`])}
                >
                  Add goal
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setList((prev) => prev.slice(0, -1))}
                  disabled={list.length === 0}
                >
                  Remove last
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  onPress={() => setList((prev) => [...prev].reverse())}
                >
                  Shuffle
                </Button>
              </Cluster>
              <AutoAnimate as="ul" className="grid grid-cols-1 gap-2">
                {list.map((item) => (
                  <li
                    key={item}
                    className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--bg-2)] px-4 py-3 text-[var(--ink-2)]"
                  >
                    {item}
                  </li>
                ))}
              </AutoAnimate>
            </Stack>

            <div className="grid grid-cols-2 gap-3">
              {["Reach", "Quality", "Speed", "Cost"].map((label) => (
                <Press key={label} hoverLift>
                  <div className="rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--bg-2)] p-5 cursor-pointer">
                    <Kicker>Insight</Kicker>
                    <Heading level={3} className="mt-2">
                      {label}
                    </Heading>
                    <Text variant="caption" className="mt-1">
                      Tap & hold to feel the spring.
                    </Text>
                  </div>
                </Press>
              ))}
            </div>
          </div>
        </Card>
      </Reveal>
    </main>
  );
}
